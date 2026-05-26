import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { createHash } from 'crypto';
import { Strategy } from '../../database/models/strategy.model';
import {
  Trade,
  TradeDirection,
  TradeStatus,
} from '../../database/models/trade.model';
import { StrategyPerformance } from '../../database/models/strategy-performance.model';
import { SyncCursor } from '../../database/models/sync-cursor.model';
import { TradingService } from '../trading/trading.service';
import { MetaApiConfigService } from '../../integrations/metaapi/metaapi-config.service';
import { Deal, Position } from '../../integrations/metaapi/interfaces';
import { SyncRunResult, SyncStrategyResult } from './dto/sync-result.dto';
import {
  computeStrategyStats,
  computeDrawdown,
  pickDay1,
} from '../strategy/strategy-stats.util';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Postgres advisory-lock key. `pg_try_advisory_xact_lock(key)` is held
 * by exactly one transaction across the entire database — any other
 * replica's sync run gets `false` and bails out gracefully.
 *
 * The value is an arbitrary stable 32-bit signed int. Postgres advisory
 * locks key off raw bigint values, so as long as no other component in
 * the system uses the same constant, we have exclusivity.
 */
const STRATEGY_SYNC_LOCK_KEY = 0x5747c9ce;

/**
 * Name registered with `SchedulerRegistry` so the cron is addressable
 * via `scheduler.getCronJob(...)` for tests and operator tooling.
 */
const CRON_JOB_NAME = 'strategy-daily-sync';

interface BuiltTrade {
  trade_id: string;
  strategy_id: string;
  account_id: string;
  symbol: string;
  direction: TradeDirection;
  entry_time: Date;
  entry_price: number;
  exit_time: Date | null;
  exit_price: number | null;
  quantity: number;
  pnl: number | null;
  status: TradeStatus;
}

interface SyncWindow {
  start: Date;
  end: Date;
}

interface SyncOptions {
  /**
   * When true (the default for `syncAll`), the run advances the
   * `sync_cursors.last_deal_synced_at` watermark. Backfills set this
   * false so manual re-pulls don't push the cursor backwards or
   * forwards unexpectedly.
   */
  updateCursor: boolean;
  /** Explicit override of the deal-fetch window. Used by backfills. */
  window?: SyncWindow;
}

/**
 * StrategySyncService — pulls broker activity from a shared MetaApi
 * account once every 24h and projects it onto the local `trades` and
 * `strategy_performance` tables.
 *
 * # Attribution
 * Every order placed via MetaApi must carry a
 * `comment: "<prefix><strategy-id>"` field (prefix defaults to `STRAT:`,
 * configurable via `STRATEGY_COMMENT_PREFIX`). Deals/positions without
 * that exact format are dropped and counted under either
 * `dealsUntagged` (no recognisable prefix) or `dealsUnknownStrategy`
 * (tagged with a UUID that doesn't match any active strategy) on the
 * run result.
 *
 * # Concurrency
 * The entire run is wrapped in a single Postgres transaction that
 * acquires `pg_try_advisory_xact_lock(STRATEGY_SYNC_LOCK_KEY)`. Only
 * one replica's run executes at a time; the others early-return with
 * `skippedReason: 'lock_held_by_other_replica'`. The lock auto-releases
 * on commit or rollback.
 *
 * # Idempotency
 * - Trade ids are deterministic UUIDv5 derived from
 *   `(account_id, positionId)`, so re-fetching the same deal always
 *   targets the same row.
 * - Snapshots are written via `ON CONFLICT (strategy_id, snapshot_day)
 *   DO UPDATE`, backed by a Postgres unique constraint. Even if two
 *   runs happen to land on the same UTC day (e.g. a 23:59 manual run +
 *   the 00:05 cron tick), only one row exists per strategy per day.
 *
 * # Window selection
 * - First run for an account: backfills `strategyBackfillDays` (default
 *   365d) of history.
 * - Subsequent runs: incremental from
 *   `cursor.last_deal_synced_at - overlap` (default 1h overlap) to
 *   `now`, so any deal MetaApi flushed just after the previous cursor
 *   commit is still picked up next time.
 */
@Injectable()
export class StrategySyncService implements OnModuleInit {
  private readonly logger = new Logger(StrategySyncService.name);

  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(Strategy) private readonly strategyModel: typeof Strategy,
    @InjectModel(Trade) private readonly tradeModel: typeof Trade,
    @InjectModel(StrategyPerformance)
    private readonly strategyPerformanceModel: typeof StrategyPerformance,
    @InjectModel(SyncCursor)
    private readonly syncCursorModel: typeof SyncCursor,
    private readonly trading: TradingService,
    private readonly config: MetaApiConfigService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  /**
   * Register the cron with the schedule registry on module bootstrap.
   * Driven by `MetaApiConfigService.strategySyncCron` so operators can
   * shift the run window without a code change.
   */
  onModuleInit(): void {
    if (this.scheduler.doesExist('cron', CRON_JOB_NAME)) {
      return;
    }
    const job = CronJob.from({
      cronTime: this.config.strategySyncCron,
      onTick: () => {
        void this.runDailySync();
      },
      timeZone: 'UTC',
      start: false,
    });
    this.scheduler.addCronJob(CRON_JOB_NAME, job as unknown as CronJob);
    job.start();
    this.logger.log(
      `Registered ${CRON_JOB_NAME} cron with schedule "${this.config.strategySyncCron}" (UTC).`,
    );
  }

  /**
   * Cron entry point. `@nestjs/schedule` discards the return value, so
   * this method is typed `Promise<void>` and only logs.
   */
  async runDailySync(): Promise<void> {
    this.logger.log('Daily strategy sync cron fired.');
    try {
      const result = await this.syncAll();
      if (result.skippedReason) {
        this.logger.warn(
          `Daily sync skipped: ${result.skippedReason}.`,
        );
      } else {
        this.logger.log(
          `Daily sync complete: fetched=${result.dealsFetched}, ` +
            `attributed=${result.dealsAttributed}, ` +
            `untagged=${result.dealsUntagged}, ` +
            `unknown=${result.dealsUnknownStrategy}, ` +
            `strategies=${result.strategiesProcessed}, ` +
            `errors=${result.perStrategy.filter((r) => r.error).length}.`,
        );
      }
    } catch (err) {
      // syncAll already logs; we still catch here so a runaway error
      // can never propagate past the cron handler boundary.
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Daily sync threw uncaught error: ${message}`);
    }
  }

  /**
   * Manual / cron entry point. Returns the rich `SyncRunResult` for
   * operator visibility.
   */
  async syncAll(): Promise<SyncRunResult> {
    return this.runSync({ updateCursor: true });
  }

  /**
   * Operator-triggered historical re-pull. Fetches deals in the
   * supplied window regardless of the cursor's position and does NOT
   * advance the cursor (so a fix-up backfill doesn't mask future
   * incremental gaps).
   */
  async runBackfill(window: SyncWindow): Promise<SyncRunResult> {
    if (
      !(window.start instanceof Date) ||
      !(window.end instanceof Date) ||
      Number.isNaN(window.start.getTime()) ||
      Number.isNaN(window.end.getTime())
    ) {
      throw new Error('runBackfill requires valid Date instances');
    }
    if (window.start >= window.end) {
      throw new Error('runBackfill requires start < end');
    }
    return this.runSync({ updateCursor: false, window });
  }

  /**
   * Core orchestration. All work happens inside one Postgres
   * transaction that holds an advisory lock for the duration. On any
   * uncaught error we roll back the entire run (trade upserts +
   * snapshot writes + cursor advance) and surface the error to the
   * caller; the next run picks up via the unchanged cursor.
   */
  private async runSync(options: SyncOptions): Promise<SyncRunResult> {
    const runAt = new Date();
    const base: SyncRunResult = {
      runAt: runAt.toISOString(),
      accountId: null,
      dealsFetched: 0,
      dealsAttributed: 0,
      dealsUntagged: 0,
      dealsUnknownStrategy: 0,
      strategiesProcessed: 0,
      perStrategy: [],
    };

    const accountId = this.config.accountId;
    if (!accountId) {
      this.logger.warn(
        'METAAPI_ACCOUNT_ID is not configured; strategy sync aborted.',
      );
      return { ...base, skippedReason: 'no_account_configured' };
    }

    if (!UUID_REGEX.test(accountId)) {
      this.logger.error(
        `METAAPI_ACCOUNT_ID="${accountId}" is not a valid UUID. ` +
          'The account_id column on trades/strategy_performance is typed UUID; ' +
          'sync aborted to avoid insert failures.',
      );
      return { ...base, skippedReason: 'invalid_account_id' };
    }

    return this.sequelize.transaction(async (t) => {
      const acquired = await this.tryAcquireAdvisoryLock(t);
      if (!acquired) {
        this.logger.warn(
          'Advisory lock held by another replica; skipping sync.',
        );
        return {
          ...base,
          accountId,
          skippedReason: 'lock_held_by_other_replica',
        };
      }

      const window =
        options.window ??
        (await this.resolveIncrementalWindow(accountId, runAt, t));

      const [deals, positions, strategies] = await Promise.all([
        this.trading.getHistoryDealsByTime(
          accountId,
          window.start,
          window.end,
        ),
        this.trading.getPositions(accountId),
        this.strategyModel.findAll({
          where: { status: 'active' },
          transaction: t,
        }),
      ]);

      this.logger.log(
        `Fetched ${deals.length} deals ` +
          `[${window.start.toISOString()} → ${window.end.toISOString()}] and ` +
          `${positions.length} open positions from MetaApi account ${accountId}. ` +
          `${strategies.length} active strategies to process.`,
      );

      const {
        dealsByStrategy,
        positionsByStrategy,
        dealsUntagged,
        dealsUnknownStrategy,
      } = this.bucketByStrategy(deals, positions, strategies);

      const dealsAttributed =
        deals.length - dealsUntagged - dealsUnknownStrategy;

      // Batch-fetch all existing trades + snapshots for active
      // strategies up front. Replaces the previous per-strategy
      // round-trips inside the loop.
      const normalizedIds = strategies.map((s) => s.id.toLowerCase());
      const [existingTrades, existingSnapshots] = await Promise.all([
        this.tradeModel.findAll({
          where: { strategy_id: { [Op.in]: normalizedIds } },
          transaction: t,
        }),
        this.strategyPerformanceModel.findAll({
          where: { strategy_id: { [Op.in]: normalizedIds } },
          attributes: ['strategy_id', 'timestamp', 'total_pnl'],
          order: [
            ['strategy_id', 'ASC'],
            ['timestamp', 'ASC'],
          ],
          transaction: t,
        }),
      ]);

      const tradesByStrategy = this.groupBy(existingTrades, (r) =>
        r.strategy_id.toLowerCase(),
      );
      const snapshotsByStrategy = this.groupBy(existingSnapshots, (r) =>
        r.strategy_id.toLowerCase(),
      );
      const existingTradeById = new Map<string, Trade>();
      for (const tr of existingTrades) existingTradeById.set(tr.trade_id, tr);

      // syncOne is sequential by design: every call writes via the
      // outer transaction's connection, which serialises queries.
      // Parallelism here would only hurt due to head-of-line blocking
      // on that single connection.
      const perStrategy: SyncStrategyResult[] = [];
      let maxDealTime: Date | null = null;

      for (const strategy of strategies) {
        const normId = strategy.id.toLowerCase();
        const strategyDeals = dealsByStrategy.get(normId) ?? [];
        const strategyPositions = positionsByStrategy.get(normId) ?? [];

        for (const d of strategyDeals) {
          const ts = new Date(d.time);
          if (
            !Number.isNaN(ts.getTime()) &&
            (maxDealTime === null || ts > maxDealTime)
          ) {
            maxDealTime = ts;
          }
        }

        const result = await this.syncOne({
          strategy,
          accountId,
          deals: strategyDeals,
          positions: strategyPositions,
          existingTrades: tradesByStrategy.get(normId) ?? [],
          existingSnapshots: snapshotsByStrategy.get(normId) ?? [],
          existingTradeById,
          runAt,
          transaction: t,
        });
        perStrategy.push(result);
      }

      if (options.updateCursor) {
        await this.advanceCursor(
          accountId,
          maxDealTime ?? window.end,
          runAt,
          t,
        );
      }

      const summary: SyncRunResult = {
        runAt: runAt.toISOString(),
        accountId,
        dealsFetched: deals.length,
        dealsAttributed,
        dealsUntagged,
        dealsUnknownStrategy,
        strategiesProcessed: strategies.length,
        perStrategy,
      };

      this.logger.log(
        `Sync run complete: fetched=${deals.length}, ` +
          `attributed=${dealsAttributed}, untagged=${dealsUntagged}, ` +
          `unknown=${dealsUnknownStrategy}, strategies=${strategies.length}, ` +
          `errors=${perStrategy.filter((r) => r.error).length}.`,
      );
      return summary;
    });
  }

  /**
   * Sync a single strategy from already-bucketed inputs. Wrapped in
   * try/catch so one strategy's failure doesn't roll back the whole
   * transaction — failed strategies are reported via `result.error`
   * and the next run will retry them.
   */
  private async syncOne(args: {
    strategy: Strategy;
    accountId: string;
    deals: Deal[];
    positions: Position[];
    existingTrades: Trade[];
    existingSnapshots: Pick<
      StrategyPerformance,
      'strategy_id' | 'timestamp' | 'total_pnl'
    >[];
    existingTradeById: Map<string, Trade>;
    runAt: Date;
    transaction: Transaction;
  }): Promise<SyncStrategyResult> {
    const {
      strategy,
      accountId,
      deals,
      positions,
      existingTrades,
      existingSnapshots,
      existingTradeById,
      runAt,
      transaction,
    } = args;
    const result: SyncStrategyResult = {
      strategyId: strategy.id,
      name: strategy.name,
      tradesUpserted: 0,
      snapshotWritten: false,
    };

    try {
      const built = this.buildTradesForStrategy({
        strategyId: strategy.id.toLowerCase(),
        accountId,
        deals,
        positions,
        existingTradeById,
        runAt,
      });

      if (built.length > 0) {
        await this.tradeModel.bulkCreate(built as never[], {
          updateOnDuplicate: [
            'strategy_id',
            'account_id',
            'symbol',
            'direction',
            'entry_time',
            'entry_price',
            'exit_time',
            'exit_price',
            'quantity',
            'pnl',
            'status',
          ],
          transaction,
        });
      }
      result.tradesUpserted = built.length;

      // Merge in any rows we just wrote so the stats helper sees a
      // consistent view in the same transaction. `existingTrades`
      // captured before the upsert misses today's net-new closed
      // trades.
      const tradesForStats = this.mergeBuiltIntoExisting(
        existingTrades,
        built,
      );

      const unrealizedPnl = positions.reduce(
        (s, p) => s + Number(p.profit ?? 0),
        0,
      );

      await this.writeTodaySnapshot({
        strategyId: strategy.id,
        accountId,
        runAt,
        unrealizedPnl,
        trades: tradesForStats,
        priorSnapshots: existingSnapshots,
        transaction,
      });
      result.snapshotWritten = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Sync failed for strategy ${strategy.id} (${strategy.name}): ${message}`,
      );
      result.error = message;
    }

    return result;
  }

  // ---------------- Helpers (some `public` for unit-test access) ----------------

  /**
   * Parse the `STRAT:<uuid>` convention (or whatever
   * `MetaApiConfigService.strategyCommentPrefix` is set to) from a
   * deal/position comment.
   *
   * Returns the lowercase UUID on match, or null for any input that
   * does not exactly match the prefix + 36-char UUID layout. The
   * prefix match is case-insensitive; the returned UUID is normalised
   * to lowercase so callers can compare against DB ids directly.
   */
  parseStratComment(comment: string | undefined | null): string | null {
    if (typeof comment !== 'string') return null;
    const prefix = this.config.strategyCommentPrefix;
    const trimmed = comment.trim();
    if (trimmed.length !== prefix.length + 36) return null;
    if (trimmed.slice(0, prefix.length).toLowerCase() !== prefix.toLowerCase())
      return null;
    const candidate = trimmed.slice(prefix.length);
    if (!UUID_REGEX.test(candidate)) return null;
    return candidate.toLowerCase();
  }

  /**
   * Convert a MetaApi positionId (broker ticket number, e.g.
   * "46214692") into a deterministic UUIDv5-shaped string suitable for
   * the `trade_id` UUID column. Same `(accountId, positionId)` pair
   * always maps to the same UUID, so upserts are stable across runs.
   */
  positionIdToTradeId(accountId: string, positionId: string): string {
    const hash = createHash('sha1')
      .update(`${accountId}:${positionId}`)
      .digest('hex');
    const variantByte = (
      (parseInt(hash.slice(16, 18), 16) & 0x3f) |
      0x80
    ).toString(16);
    return [
      hash.slice(0, 8),
      hash.slice(8, 12),
      '5' + hash.slice(13, 16),
      variantByte + hash.slice(18, 20),
      hash.slice(20, 32),
    ].join('-');
  }

  private bucketByStrategy(
    deals: Deal[],
    positions: Position[],
    strategies: Strategy[],
  ): {
    dealsByStrategy: Map<string, Deal[]>;
    positionsByStrategy: Map<string, Position[]>;
    dealsUntagged: number;
    dealsUnknownStrategy: number;
  } {
    const knownIds = new Set(strategies.map((s) => s.id.toLowerCase()));
    const dealsByStrategy = new Map<string, Deal[]>();
    const positionsByStrategy = new Map<string, Position[]>();
    let dealsUntagged = 0;
    let dealsUnknownStrategy = 0;

    for (const deal of deals) {
      const stratId = this.parseStratComment(deal.comment);
      if (!stratId) {
        dealsUntagged++;
        continue;
      }
      if (!knownIds.has(stratId)) {
        dealsUnknownStrategy++;
        continue;
      }
      const arr = dealsByStrategy.get(stratId) ?? [];
      arr.push(deal);
      dealsByStrategy.set(stratId, arr);
    }

    for (const position of positions) {
      const stratId = this.parseStratComment(position.comment);
      if (!stratId || !knownIds.has(stratId)) continue;
      const arr = positionsByStrategy.get(stratId) ?? [];
      arr.push(position);
      positionsByStrategy.set(stratId, arr);
    }

    return {
      dealsByStrategy,
      positionsByStrategy,
      dealsUntagged,
      dealsUnknownStrategy,
    };
  }

  /**
   * Group this strategy's deals by positionId, pair them with any
   * currently-open positions, and emit one `BuiltTrade` per position
   * lifecycle ready for upsert.
   *
   * Critically: if an exit deal arrives for a position whose entry
   * deal is outside our incremental window, we look up the existing
   * `Trade` row (matched by deterministic `trade_id`) and merge —
   * eliminating the "entry deal absent" anomaly that the old 30-day
   * rolling window suffered from.
   */
  private buildTradesForStrategy(args: {
    strategyId: string;
    accountId: string;
    deals: Deal[];
    positions: Position[];
    existingTradeById: Map<string, Trade>;
    runAt: Date;
  }): BuiltTrade[] {
    const { strategyId, accountId, deals, positions, existingTradeById } =
      args;
    const dealsByPosition = new Map<string, Deal[]>();
    for (const deal of deals) {
      if (!deal.positionId) continue;
      const arr = dealsByPosition.get(deal.positionId) ?? [];
      arr.push(deal);
      dealsByPosition.set(deal.positionId, arr);
    }

    const positionById = new Map<string, Position>();
    for (const p of positions) positionById.set(p.id, p);

    const allPositionIds = new Set<string>([
      ...dealsByPosition.keys(),
      ...positionById.keys(),
    ]);

    const built: BuiltTrade[] = [];

    for (const positionId of allPositionIds) {
      const tradeId = this.positionIdToTradeId(accountId, positionId);
      const existing = existingTradeById.get(tradeId);
      const positionDeals = (dealsByPosition.get(positionId) ?? []).slice();
      const livePosition = positionById.get(positionId);

      positionDeals.sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
      );

      const explicitEntryDeal = positionDeals.find(
        (d) => d.entryType === 'DEAL_ENTRY_IN',
      );
      const exitDeals = positionDeals.filter(
        (d) =>
          d.entryType === 'DEAL_ENTRY_OUT' ||
          d.entryType === 'DEAL_ENTRY_OUT_BY',
      );

      let symbol: string | undefined;
      let direction: TradeDirection | undefined;
      let entry_time: Date | undefined;
      let entry_price: number | undefined;
      let quantity: number | undefined;

      if (explicitEntryDeal) {
        symbol = explicitEntryDeal.symbol;
        direction =
          explicitEntryDeal.type === 'DEAL_TYPE_BUY'
            ? TradeDirection.LONG
            : TradeDirection.SHORT;
        entry_time = new Date(explicitEntryDeal.time);
        entry_price = Number(explicitEntryDeal.price);
        quantity = Number(explicitEntryDeal.volume);
      } else if (existing) {
        // Entry deal is outside our incremental window but we have the
        // open trade row from a previous sync — merge in the prior
        // entry data and let the exit deals below close it out.
        symbol = existing.symbol;
        direction = existing.direction;
        entry_time = existing.entry_time;
        entry_price = Number(existing.entry_price);
        quantity = Number(existing.quantity);
      } else if (livePosition) {
        // Defensive: position open with no entry deal and no prior
        // Trade row. Represent it as an open trade using position
        // fields so the sync at least surfaces it.
        symbol = livePosition.symbol;
        direction =
          livePosition.type === 'POSITION_TYPE_BUY'
            ? TradeDirection.LONG
            : TradeDirection.SHORT;
        entry_time = livePosition.time
          ? new Date(livePosition.time)
          : args.runAt;
        entry_price = Number(livePosition.openPrice);
        quantity = Number(livePosition.volume);
      }

      if (
        !symbol ||
        !direction ||
        !entry_time ||
        entry_price === undefined ||
        quantity === undefined ||
        Number.isNaN(entry_price) ||
        Number.isNaN(quantity)
      ) {
        this.logger.warn(
          `Skipping positionId=${positionId} for strategy ${strategyId}: ` +
            'insufficient data to build a trade row.',
        );
        continue;
      }

      let status: TradeStatus;
      let exit_time: Date | null = null;
      let exit_price: number | null = null;
      let pnl: number | null = null;

      if (livePosition && exitDeals.length === 0) {
        status = TradeStatus.OPEN;
      } else if (!livePosition && exitDeals.length > 0) {
        status = TradeStatus.CLOSED;
        exit_time = exitDeals.reduce<Date>(
          (max, d) => {
            const t = new Date(d.time);
            return t > max ? t : max;
          },
          new Date(exitDeals[0].time),
        );
        const totalExitVolume = exitDeals.reduce(
          (s, d) => s + Number(d.volume),
          0,
        );
        exit_price =
          totalExitVolume > 0
            ? exitDeals.reduce(
                (s, d) => s + Number(d.price) * Number(d.volume),
                0,
              ) / totalExitVolume
            : Number(exitDeals[0].price);
        // PnL = sum over ALL position deals (entry + exits) when we
        // have them, or carry over existing.pnl plus the new exits if
        // we're merging into a prior open row.
        pnl = positionDeals.reduce((s, d) => s + Number(d.profit ?? 0), 0);
        if (existing && !explicitEntryDeal) {
          // Carry forward whatever realised pnl was already on the
          // open row (defensive — usually null on open trades).
          pnl += Number(existing.pnl ?? 0);
        }
      } else if (livePosition && exitDeals.length > 0) {
        // Partial closes while the position is still open. The
        // remaining volume is still live, so the row stays `open`;
        // realised PnL on the partials surfaces at the snapshot step
        // once the position fully closes (a later run).
        status = TradeStatus.OPEN;
      } else if (!livePosition && existing) {
        // No new deals, no live position. Whatever we already wrote
        // for this trade stays as-is; don't synthesise a new row.
        continue;
      } else {
        // Entry deal with no live position and no exit deal — anomaly
        // (likely a deal type we don't recognise). Skip defensively.
        this.logger.warn(
          `Skipping positionId=${positionId} for strategy ${strategyId}: ` +
            'entry deal present but no matching open position or close deals.',
        );
        continue;
      }

      built.push({
        trade_id: tradeId,
        strategy_id: strategyId,
        account_id: accountId,
        symbol,
        direction,
        entry_time,
        entry_price,
        exit_time,
        exit_price,
        quantity,
        pnl,
        status,
      });
    }

    return built;
  }

  /**
   * Upsert today's `strategy_performance` row. Backed by the Postgres
   * UNIQUE (strategy_id, snapshot_day) constraint added in the
   * 2026-05-25 migration; collisions on the same UTC day route through
   * ON CONFLICT DO UPDATE rather than throwing or duplicating.
   *
   * Stats are computed via the shared `computeStrategyStats` helper so
   * the writer and the reader (`StrategyService.getPerformance`) can
   * never disagree on what the columns mean.
   */
  private async writeTodaySnapshot(args: {
    strategyId: string;
    accountId: string;
    runAt: Date;
    unrealizedPnl: number;
    trades: Trade[];
    priorSnapshots: Pick<
      StrategyPerformance,
      'strategy_id' | 'timestamp' | 'total_pnl'
    >[];
    transaction: Transaction;
  }): Promise<void> {
    const {
      strategyId,
      accountId,
      runAt,
      unrealizedPnl,
      trades,
      priorSnapshots,
      transaction,
    } = args;

    // Day-1 anchor for trade filtering: earliest snapshot or runAt
    // (fresh strategy with no history yet).
    const day1 = pickDay1(priorSnapshots) ?? runAt;
    const stats = computeStrategyStats(
      trades,
      priorSnapshots,
      unrealizedPnl,
      day1,
    );

    // Re-walk drawdown including today's about-to-be-written value so
    // the stored numbers reflect "after today" rather than "before
    // today" (avoiding a one-day lag in current_drawdown).
    const drawdownInclToday = computeDrawdown([
      ...priorSnapshots,
      { timestamp: runAt, total_pnl: stats.totalPnL },
    ]);

    await this.strategyPerformanceModel.upsert(
      {
        strategy_id: strategyId,
        account_id: accountId,
        timestamp: runAt,
        total_trades: stats.totalTrades,
        winning_trades: stats.winningTrades,
        losing_trades: stats.losingTrades,
        win_rate: parseFloat(stats.winRate.toFixed(4)),
        total_pnl: parseFloat(stats.totalPnL.toFixed(8)),
        unrealized_pnl: parseFloat(stats.unrealizedPnL.toFixed(8)),
        realized_pnl: parseFloat(stats.realizedPnL.toFixed(8)),
        max_drawdown: parseFloat(drawdownInclToday.maxDrawdown.toFixed(4)),
        current_drawdown: parseFloat(
          drawdownInclToday.currentDrawdown.toFixed(4),
        ),
      } as never,
      {
        conflictFields: ['strategy_id', 'snapshot_day'],
        transaction,
      },
    );
  }

  // ---------------- Cursor / lock plumbing ----------------

  /**
   * Acquire the global advisory lock for this run. Returns true on
   * success; false if another replica holds it. The lock is
   * transaction-scoped, so it auto-releases on commit/rollback — no
   * `finally` cleanup needed.
   */
  private async tryAcquireAdvisoryLock(t: Transaction): Promise<boolean> {
    const rows = await this.sequelize.query<{ locked: boolean }>(
      'SELECT pg_try_advisory_xact_lock(:key) AS locked',
      {
        transaction: t,
        replacements: { key: STRATEGY_SYNC_LOCK_KEY },
        type: QueryTypes.SELECT,
      },
    );
    return rows[0]?.locked === true;
  }

  /**
   * Look up the per-account cursor and build the deal-fetch window
   * for an incremental run:
   *   - First run (no cursor row) → backfill `strategyBackfillDays`.
   *   - Subsequent → `[last_deal_synced_at - overlap, now]`.
   */
  private async resolveIncrementalWindow(
    accountId: string,
    runAt: Date,
    t: Transaction,
  ): Promise<SyncWindow> {
    const cursor = await this.syncCursorModel.findByPk(accountId, {
      transaction: t,
    });
    if (!cursor) {
      const start = new Date(
        runAt.getTime() -
          this.config.strategyBackfillDays * 24 * 60 * 60 * 1000,
      );
      this.logger.log(
        `No sync_cursor for account ${accountId}; first-run backfill ` +
          `from ${start.toISOString()}.`,
      );
      return { start, end: runAt };
    }
    const overlapMs = this.config.strategySyncOverlapMinutes * 60 * 1000;
    const start = new Date(cursor.last_deal_synced_at.getTime() - overlapMs);
    return { start, end: runAt };
  }

  /**
   * Persist the advanced watermark. Uses Sequelize `upsert` keyed on
   * the primary key `account_id`. Only moves the watermark forward —
   * if `maxDealTime` is older than the existing cursor (because no new
   * deals landed in this window), we keep the existing cursor.
   */
  private async advanceCursor(
    accountId: string,
    maxDealTime: Date,
    runAt: Date,
    t: Transaction,
  ): Promise<void> {
    const existing = await this.syncCursorModel.findByPk(accountId, {
      transaction: t,
    });
    const nextHighWater =
      existing && existing.last_deal_synced_at > maxDealTime
        ? existing.last_deal_synced_at
        : maxDealTime;
    await this.syncCursorModel.upsert(
      {
        account_id: accountId,
        last_deal_synced_at: nextHighWater,
        last_run_at: runAt,
      } as never,
      { transaction: t },
    );
  }

  // ---------------- Small utilities ----------------

  private groupBy<T>(items: T[], keyFn: (t: T) => string): Map<string, T[]> {
    const out = new Map<string, T[]>();
    for (const it of items) {
      const k = keyFn(it);
      const arr = out.get(k) ?? [];
      arr.push(it);
      out.set(k, arr);
    }
    return out;
  }

  /**
   * Return a combined trade list where rows in `built` replace any
   * `existing` entry with the same `trade_id`. The stats helper needs
   * the post-upsert view of the world; `existing` alone would miss
   * trades that just got closed in this run.
   */
  private mergeBuiltIntoExisting(
    existing: Trade[],
    built: BuiltTrade[],
  ): Trade[] {
    if (built.length === 0) return existing;
    const builtById = new Map<string, BuiltTrade>();
    for (const b of built) builtById.set(b.trade_id, b);
    const merged: Trade[] = [];
    for (const t of existing) {
      const b = builtById.get(t.trade_id);
      if (b) {
        // Shape a synthetic Trade-like for the stats helper. We only
        // touch the fields the helper reads.
        merged.push({
          ...t.get(),
          entry_time: b.entry_time,
          status: b.status,
          pnl: b.pnl,
        } as Trade);
        builtById.delete(t.trade_id);
      } else {
        merged.push(t);
      }
    }
    for (const b of builtById.values()) {
      merged.push({
        trade_id: b.trade_id,
        strategy_id: b.strategy_id,
        account_id: b.account_id,
        symbol: b.symbol,
        direction: b.direction,
        entry_time: b.entry_time,
        entry_price: b.entry_price,
        exit_time: b.exit_time,
        exit_price: b.exit_price,
        quantity: b.quantity,
        pnl: b.pnl,
        status: b.status,
      } as unknown as Trade);
    }
    return merged;
  }
}

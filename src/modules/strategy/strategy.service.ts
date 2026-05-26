import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { randomUUID } from 'crypto';
import { Strategy } from '../../database/models/strategy.model';
import { Trade } from '../../database/models/trade.model';
import { StrategyPerformance } from '../../database/models/strategy-performance.model';
import { RealTimeStrategy } from '../../database/models/real-time-strategy.model';
import { RealTimeTrade } from '../../database/models/real-time-trade.model';
import { CreateStrategyDto, UpdateStrategyDto } from './dto';
import { StrategyPerformanceDto } from './dto/strategy-performance.dto';
import { PublicStrategySummaryDto } from './dto/public-strategy-summary.dto';
import { EquityCurvePointDto } from './dto/equity-curve.dto';
import { SeedResultDto } from './dto/seed-result.dto';
import { computeStrategyStats } from './strategy-stats.util';

/**
 * Shared advisory-lock key for "anything that rewrites strategy state
 * in bulk" — the daily strategy-sync run AND the dev seed both grab
 * this same key inside their transaction. That way the sync cron and
 * a manually-triggered seed cannot interleave, and two concurrent
 * seeds cannot race against each other.
 *
 * Must match `STRATEGY_SYNC_LOCK_KEY` in
 * `src/modules/strategy-sync/strategy-sync.service.ts`. Don't change
 * either value in isolation.
 */
const STRATEGY_WRITE_LOCK_KEY = 0x5747c9ce;

@Injectable()
export class StrategyService {
  private readonly logger = new Logger(StrategyService.name);

  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(Strategy)
    private readonly strategyModel: typeof Strategy,
    @InjectModel(Trade)
    private readonly tradeModel: typeof Trade,
    @InjectModel(StrategyPerformance)
    private readonly strategyPerformanceModel: typeof StrategyPerformance,
    @InjectModel(RealTimeStrategy)
    private readonly realTimeStrategyModel: typeof RealTimeStrategy,
    @InjectModel(RealTimeTrade)
    private readonly realTimeTradeModel: typeof RealTimeTrade,
  ) {}

  /**
   * Create a new strategy.
   */
  async create(dto: CreateStrategyDto): Promise<Strategy> {
    try {
      const strategy = await this.strategyModel.create({
        name: dto.name,
        status: 'active',
      });

      this.logger.log(`Strategy created: ${strategy.id}`);
      return strategy;
    } catch (error) {
      this.logger.error(`Failed to create strategy: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all strategies.
   */
  async findAll(): Promise<Strategy[]> {
    try {
      return await this.strategyModel.findAll({
        order: [['createdAt', 'DESC']],
      });
    } catch (error) {
      this.logger.error(`Failed to fetch strategies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a single strategy by ID.
   */
  async findById(id: string): Promise<Strategy> {
    try {
      const strategy = await this.strategyModel.findByPk(id);
      if (!strategy) {
        throw new NotFoundException(`Strategy with ID ${id} not found`);
      }
      return strategy;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch strategy ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a strategy.
   */
  async update(id: string, dto: UpdateStrategyDto): Promise<Strategy> {
    try {
      const strategy = await this.findById(id);

      if (dto.name !== undefined) {
        strategy.name = dto.name;
      }
      if (dto.status !== undefined) {
        strategy.status = dto.status;
      }

      await strategy.save();
      this.logger.log(`Strategy updated: ${id}`);
      return strategy;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update strategy ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a strategy.
   */
  async delete(id: string): Promise<void> {
    try {
      const strategy = await this.findById(id);
      await strategy.destroy();
      this.logger.log(`Strategy deleted: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete strategy ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get live performance metrics for a strategy.
   *
   * All counts and drawdown metrics are anchored to "day 1" — the earliest
   * `strategy_performance` snapshot for the strategy. This is dynamic per
   * strategy; it is NOT a hard-coded calendar date.
   *
   * - `totalTrades`: count of trades with `entry_time >= day1` (any status).
   * - `winRate`: closed-only — `winning_closed / total_closed`. Open and
   *   cancelled trades are excluded from both numerator and denominator.
   * - `maxDrawdown` / `currentDrawdown`: absolute USD peak-to-trough on the
   *   `strategy_performance.total_pnl` series since day 1. Peak must precede
   *   the trough in time. Always returned as a non-negative USD amount.
   *
   * Percentage return (`totalReturn`) is intentionally not reported — it
   * requires an account-level "money in account" baseline that is out of
   * scope for this endpoint.
   */
  async getPerformance(strategyId: string): Promise<StrategyPerformanceDto> {
    try {
      await this.findById(strategyId);

      // `real_time_strategies` is the fast-path mirror for sum totals,
      // populated by the Postgres trigger from the most recent
      // `strategy_performance` snapshot. We read it as-is for
      // `totalPnL` / `unrealizedPnL` to keep this endpoint O(1) on
      // those values; the trade-derived metrics (win rate, drawdown,
      // counts) still come from the source-of-truth helper below.
      const realTimeData =
        await this.realTimeStrategyModel.findByPk(strategyId);
      const totalPnL = Number(realTimeData?.total_pnl || 0);
      const unrealizedPnL = Number(realTimeData?.unrealized_pnl || 0);
      const realizedPnL = totalPnL - unrealizedPnL;
      const lastUpdated = realTimeData?.last_updated || new Date();

      const day1Row = await this.strategyPerformanceModel.findOne({
        where: { strategy_id: strategyId },
        order: [['timestamp', 'ASC']],
        attributes: ['timestamp'],
      });
      const day1 = day1Row?.timestamp ?? null;

      if (!day1) {
        return {
          strategyId,
          totalPnL: parseFloat(totalPnL.toFixed(8)),
          unrealizedPnL: parseFloat(unrealizedPnL.toFixed(8)),
          realizedPnL: parseFloat(realizedPnL.toFixed(8)),
          winRate: 0,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          maxDrawdown: 0,
          currentDrawdown: 0,
          lastUpdated,
        };
      }

      const [trades, snapshots] = await Promise.all([
        this.tradeModel.findAll({
          where: {
            strategy_id: strategyId,
            entry_time: { [Op.gte]: day1 },
          },
        }),
        this.strategyPerformanceModel.findAll({
          where: {
            strategy_id: strategyId,
            timestamp: { [Op.gte]: day1 },
          },
          order: [['timestamp', 'ASC']],
          attributes: ['timestamp', 'total_pnl'],
        }),
      ]);

      const stats = computeStrategyStats(
        trades,
        snapshots,
        unrealizedPnL,
        day1,
      );

      return {
        strategyId,
        totalPnL: parseFloat(totalPnL.toFixed(8)),
        unrealizedPnL: parseFloat(unrealizedPnL.toFixed(8)),
        realizedPnL: parseFloat(realizedPnL.toFixed(8)),
        winRate: parseFloat(stats.winRate.toFixed(4)),
        totalTrades: stats.totalTrades,
        winningTrades: stats.winningTrades,
        losingTrades: stats.losingTrades,
        maxDrawdown: parseFloat(stats.maxDrawdown.toFixed(8)),
        currentDrawdown: parseFloat(stats.currentDrawdown.toFixed(8)),
        lastUpdated,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get performance for strategy ${strategyId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get a public summary (no capital info, no totalReturn).
   */
  async getPublicSummary(
    strategyId: string,
  ): Promise<PublicStrategySummaryDto> {
    try {
      const strategy = await this.findById(strategyId);
      const performance = await this.getPerformance(strategyId);

      return {
        strategyId,
        name: strategy.name,
        winRate: performance.winRate,
        totalTrades: performance.totalTrades,
        maxDrawdown: performance.maxDrawdown,
        lastUpdated: performance.lastUpdated,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get public summary for strategy ${strategyId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get trades for a strategy with pagination.
   */
  async getTrades(
    strategyId: string,
    limit: number = 50,
    offset: number = 0,
    status?: string,
  ): Promise<{ trades: Trade[]; total: number }> {
    try {
      await this.findById(strategyId);

      const where: Record<string, unknown> = { strategy_id: strategyId };
      if (status) {
        where.status = status;
      }

      const { rows, count } = await this.tradeModel.findAndCountAll({
        where,
        limit,
        offset,
        order: [['entry_time', 'DESC']],
      });

      return { trades: rows, total: count };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get trades for strategy ${strategyId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get equity curve points (cumulative PnL + drawdown over time).
   * `equity` (absolute) is no longer reported because initial_capital was
   * removed; `totalPnL` is the relative growth signal.
   */
  async getEquityCurve(
    strategyId: string,
    days: number = 30,
  ): Promise<EquityCurvePointDto[]> {
    try {
      await this.findById(strategyId);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const performances = await this.strategyPerformanceModel.findAll({
        where: {
          strategy_id: strategyId,
          timestamp: {
            [Op.gte]: startDate,
          },
        },
        order: [['timestamp', 'ASC']],
      });

      return performances.map((perf) => ({
        timestamp: perf.timestamp,
        totalPnL: Number(perf.total_pnl),
        drawdown: Number(perf.current_drawdown),
      }));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get equity curve for strategy ${strategyId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Seed deterministic demo data for local/dev testing.
   *
   * Wipes every existing strategy (and their snapshots, trades, and
   * real-time mirror rows), then creates **exactly 10** fresh strategies
   * named `Strategy 1`..`Strategy 10` with a 10-day `pnlSeries` and a
   * mix of closed/open/cancelled trades each. The Postgres sync triggers
   * auto-populate the `real_time_*` tables; we don't write to them
   * directly.
   *
   * # Atomicity
   * The entire operation runs inside a single Postgres transaction. If
   * any insert fails (constraint violation, network blip, etc.), every
   * earlier insert in the same run is rolled back. The database is
   * never left in a partial state.
   *
   * # Concurrency
   * The transaction acquires `pg_try_advisory_xact_lock(STRATEGY_WRITE_LOCK_KEY)`
   * — the **same** lock the strategy-sync cron uses. This means:
   *   - Two operators hitting `POST /strategies/dev/seed` at the same
   *     time: the second one gets HTTP 409, no mid-cleanup interleave.
   *   - The 00:05 UTC sync cron firing during a seed: the cron gets
   *     `skippedReason: 'lock_held_by_other_replica'` and tries again
   *     on its next tick.
   *   - The seed running while a sync is mid-flight: the seed gets a
   *     409 — fail fast instead of partial state.
   *
   * Intentionally allowed in every environment (including production)
   * — the only safety net is the advisory-lock concurrency contract
   * enforced below.
   */
  async seedDevData(dayOneIso?: string): Promise<SeedResultDto[]> {
    const dayOne = this.parseDayOne(dayOneIso);

    interface TradeSeed {
      symbol: string;
      direction: 'long' | 'short';
      dayOffset: number;
      entryPrice: number;
      exitPrice: number | null;
      quantity: number;
      pnl: number | null;
      status: 'open' | 'closed' | 'cancelled';
    }
    interface StrategySeed {
      name: string;
      accountId: string;
      pnlSeries: number[];
      trades: TradeSeed[];
    }

    // Seed names are kept generic (`Strategy 1`..`Strategy 10`) so the
    // demo dataset doesn't pretend to represent any specific trading
    // style. The per-seed `pnlSeries` and `trades` shapes are still
    // deliberately varied (trending up, oscillating, drawdown-heavy,
    // etc.) so the UI has realistic-looking charts to render.
    const SEEDS: StrategySeed[] = [
      {
        name: 'Strategy 1',
        accountId: '11111111-1111-1111-1111-111111111111',
        // Peak ratchets 0→320, then dips to 220 → max DD 100, current DD 100.
        pnlSeries: [0, 120, 180, 250, 200, 150, 280, 320, 290, 220],
        trades: [
          { symbol: 'EURUSD', direction: 'long',  dayOffset: 1, entryPrice: 1.0800, exitPrice: 1.0850, quantity: 1.00, pnl:  50, status: 'closed' },
          { symbol: 'EURUSD', direction: 'long',  dayOffset: 1, entryPrice: 1.0830, exitPrice: 1.0860, quantity: 1.00, pnl:  30, status: 'closed' },
          { symbol: 'EURUSD', direction: 'long',  dayOffset: 2, entryPrice: 1.0850, exitPrice: 1.0930, quantity: 1.00, pnl:  80, status: 'closed' },
          { symbol: 'EURUSD', direction: 'long',  dayOffset: 3, entryPrice: 1.0920, exitPrice: 1.0940, quantity: 1.00, pnl:  20, status: 'closed' },
          { symbol: 'EURUSD', direction: 'short', dayOffset: 4, entryPrice: 1.0950, exitPrice: 1.0930, quantity: 1.00, pnl: -20, status: 'closed' },
          { symbol: 'EURUSD', direction: 'long',  dayOffset: 5, entryPrice: 1.0900, exitPrice: 1.0885, quantity: 1.00, pnl: -15, status: 'closed' },
          { symbol: 'EURUSD', direction: 'long',  dayOffset: 6, entryPrice: 1.0880, exitPrice: 1.0920, quantity: 1.00, pnl:  40, status: 'closed' },
          { symbol: 'EURUSD', direction: 'long',  dayOffset: 6, entryPrice: 1.0900, exitPrice: 1.0925, quantity: 1.00, pnl:  25, status: 'closed' },
          { symbol: 'EURUSD', direction: 'long',  dayOffset: 7, entryPrice: 1.0930, exitPrice: 1.0990, quantity: 1.00, pnl:  60, status: 'closed' },
          { symbol: 'EURUSD', direction: 'long',  dayOffset: 7, entryPrice: 1.0950, exitPrice: 1.1020, quantity: 1.00, pnl:  70, status: 'closed' },
          { symbol: 'EURUSD', direction: 'short', dayOffset: 8, entryPrice: 1.1010, exitPrice: 1.1050, quantity: 1.00, pnl: -40, status: 'closed' },
          { symbol: 'EURUSD', direction: 'long',  dayOffset: 9, entryPrice: 1.0980, exitPrice: null,   quantity: 1.00, pnl: null, status: 'open' },
          { symbol: 'EURUSD', direction: 'short', dayOffset: 9, entryPrice: 1.0990, exitPrice: null,   quantity: 1.00, pnl: null, status: 'cancelled' },
        ],
      },
      {
        name: 'Strategy 2',
        accountId: '22222222-2222-2222-2222-222222222222',
        // Smaller swings; ends at all-time peak so currentDrawdown is 0.
        // Peaks 80→100→110→130 → max DD 25 (100→75), current DD 0.
        pnlSeries: [50, 80, 60, 100, 90, 75, 110, 95, 105, 130],
        trades: [
          { symbol: 'GER40', direction: 'long',  dayOffset: 1, entryPrice: 18000, exitPrice: 18010, quantity: 0.10, pnl:  10, status: 'closed' },
          { symbol: 'GER40', direction: 'short', dayOffset: 1, entryPrice: 18020, exitPrice: 18012, quantity: 0.10, pnl:  -8, status: 'closed' },
          { symbol: 'GER40', direction: 'long',  dayOffset: 2, entryPrice: 18005, exitPrice: 18020, quantity: 0.10, pnl:  15, status: 'closed' },
          { symbol: 'GER40', direction: 'long',  dayOffset: 3, entryPrice: 18015, exitPrice: 18003, quantity: 0.10, pnl: -12, status: 'closed' },
          { symbol: 'GER40', direction: 'short', dayOffset: 4, entryPrice: 18030, exitPrice: 18010, quantity: 0.10, pnl:  20, status: 'closed' },
          { symbol: 'GER40', direction: 'long',  dayOffset: 5, entryPrice: 18000, exitPrice: 17990, quantity: 0.10, pnl: -10, status: 'closed' },
          { symbol: 'GER40', direction: 'long',  dayOffset: 6, entryPrice: 17995, exitPrice: 18007, quantity: 0.10, pnl:  12, status: 'closed' },
          { symbol: 'GER40', direction: 'short', dayOffset: 7, entryPrice: 18010, exitPrice: 18025, quantity: 0.10, pnl: -15, status: 'closed' },
          { symbol: 'GER40', direction: 'long',  dayOffset: 8, entryPrice: 18020, exitPrice: 18038, quantity: 0.10, pnl:  18, status: 'closed' },
          { symbol: 'GER40', direction: 'short', dayOffset: 9, entryPrice: 18040, exitPrice: 18045, quantity: 0.10, pnl:  -5, status: 'closed' },
          { symbol: 'GER40', direction: 'long',  dayOffset: 9, entryPrice: 18035, exitPrice: null,  quantity: 0.10, pnl: null, status: 'open' },
          { symbol: 'GER40', direction: 'short', dayOffset: 9, entryPrice: 18045, exitPrice: null,  quantity: 0.10, pnl: null, status: 'cancelled' },
        ],
      },
      {
        name: 'Strategy 3',
        accountId: '33333333-3333-3333-3333-333333333333',
        // Steady high-frequency uptrend. Peak 160, last 160 → max DD 10, current DD 0.
        pnlSeries: [0, 25, 50, 70, 60, 85, 110, 130, 140, 160],
        trades: [
          { symbol: 'GBPUSD', direction: 'long',  dayOffset: 1, entryPrice: 1.2600, exitPrice: 1.2612, quantity: 0.50, pnl:  6,  status: 'closed' },
          { symbol: 'GBPUSD', direction: 'long',  dayOffset: 1, entryPrice: 1.2610, exitPrice: 1.2625, quantity: 0.50, pnl:  7,  status: 'closed' },
          { symbol: 'GBPUSD', direction: 'short', dayOffset: 2, entryPrice: 1.2640, exitPrice: 1.2620, quantity: 0.50, pnl:  10, status: 'closed' },
          { symbol: 'GBPUSD', direction: 'long',  dayOffset: 3, entryPrice: 1.2615, exitPrice: 1.2625, quantity: 0.50, pnl:  5,  status: 'closed' },
          { symbol: 'GBPUSD', direction: 'short', dayOffset: 4, entryPrice: 1.2640, exitPrice: 1.2650, quantity: 0.50, pnl:  -5, status: 'closed' },
          { symbol: 'GBPUSD', direction: 'long',  dayOffset: 5, entryPrice: 1.2630, exitPrice: 1.2650, quantity: 0.50, pnl:  10, status: 'closed' },
          { symbol: 'GBPUSD', direction: 'long',  dayOffset: 6, entryPrice: 1.2655, exitPrice: 1.2680, quantity: 0.50, pnl:  12, status: 'closed' },
          { symbol: 'GBPUSD', direction: 'short', dayOffset: 7, entryPrice: 1.2700, exitPrice: 1.2685, quantity: 0.50, pnl:  8,  status: 'closed' },
          { symbol: 'GBPUSD', direction: 'long',  dayOffset: 8, entryPrice: 1.2690, exitPrice: 1.2710, quantity: 0.50, pnl:  10, status: 'closed' },
          { symbol: 'GBPUSD', direction: 'long',  dayOffset: 9, entryPrice: 1.2720, exitPrice: null,   quantity: 0.50, pnl: null, status: 'open' },
          { symbol: 'GBPUSD', direction: 'short', dayOffset: 9, entryPrice: 1.2725, exitPrice: null,   quantity: 0.50, pnl: null, status: 'cancelled' },
        ],
      },
      {
        name: 'Strategy 4',
        accountId: '44444444-4444-4444-4444-444444444444',
        // Strong breakout with pullbacks. Peak 800, last 750 → max DD 50, current DD 50.
        pnlSeries: [0, 200, 400, 350, 600, 550, 700, 650, 800, 750],
        trades: [
          { symbol: 'NAS100', direction: 'long',  dayOffset: 1, entryPrice: 17500, exitPrice: 17600, quantity: 0.02, pnl:  200, status: 'closed' },
          { symbol: 'NAS100', direction: 'long',  dayOffset: 2, entryPrice: 17620, exitPrice: 17720, quantity: 0.02, pnl:  200, status: 'closed' },
          { symbol: 'NAS100', direction: 'short', dayOffset: 3, entryPrice: 17700, exitPrice: 17750, quantity: 0.02, pnl: -100, status: 'closed' },
          { symbol: 'NAS100', direction: 'long',  dayOffset: 4, entryPrice: 17800, exitPrice: 17950, quantity: 0.02, pnl:  300, status: 'closed' },
          { symbol: 'NAS100', direction: 'long',  dayOffset: 5, entryPrice: 17960, exitPrice: 17935, quantity: 0.02, pnl:  -50, status: 'closed' },
          { symbol: 'NAS100', direction: 'long',  dayOffset: 6, entryPrice: 17950, exitPrice: 18025, quantity: 0.02, pnl:  150, status: 'closed' },
          { symbol: 'NAS100', direction: 'short', dayOffset: 7, entryPrice: 18050, exitPrice: 18075, quantity: 0.02, pnl:  -50, status: 'closed' },
          { symbol: 'NAS100', direction: 'long',  dayOffset: 8, entryPrice: 18100, exitPrice: 18175, quantity: 0.02, pnl:  150, status: 'closed' },
          { symbol: 'NAS100', direction: 'short', dayOffset: 9, entryPrice: 18200, exitPrice: 18225, quantity: 0.02, pnl:  -50, status: 'closed' },
          { symbol: 'NAS100', direction: 'long',  dayOffset: 9, entryPrice: 18180, exitPrice: null,  quantity: 0.02, pnl: null, status: 'open' },
          { symbol: 'NAS100', direction: 'short', dayOffset: 9, entryPrice: 18210, exitPrice: null,  quantity: 0.02, pnl: null, status: 'cancelled' },
        ],
      },
      {
        name: 'Strategy 5',
        accountId: '55555555-5555-5555-5555-555555555555',
        // Smooth uptrend with one dip. Peak 650, last 650 → max DD 30, current DD 0.
        pnlSeries: [0, 80, 150, 200, 280, 250, 350, 450, 550, 650],
        trades: [
          { symbol: 'XAUUSD', direction: 'long',  dayOffset: 1, entryPrice: 2150.0, exitPrice: 2158.0, quantity: 0.10, pnl:  80,  status: 'closed' },
          { symbol: 'XAUUSD', direction: 'long',  dayOffset: 2, entryPrice: 2160.0, exitPrice: 2167.0, quantity: 0.10, pnl:  70,  status: 'closed' },
          { symbol: 'XAUUSD', direction: 'long',  dayOffset: 3, entryPrice: 2170.0, exitPrice: 2175.0, quantity: 0.10, pnl:  50,  status: 'closed' },
          { symbol: 'XAUUSD', direction: 'long',  dayOffset: 4, entryPrice: 2178.0, exitPrice: 2186.0, quantity: 0.10, pnl:  80,  status: 'closed' },
          { symbol: 'XAUUSD', direction: 'short', dayOffset: 5, entryPrice: 2188.0, exitPrice: 2191.0, quantity: 0.10, pnl: -30,  status: 'closed' },
          { symbol: 'XAUUSD', direction: 'long',  dayOffset: 6, entryPrice: 2185.0, exitPrice: 2195.0, quantity: 0.10, pnl:  100, status: 'closed' },
          { symbol: 'XAUUSD', direction: 'long',  dayOffset: 7, entryPrice: 2200.0, exitPrice: 2210.0, quantity: 0.10, pnl:  100, status: 'closed' },
          { symbol: 'XAUUSD', direction: 'long',  dayOffset: 8, entryPrice: 2212.0, exitPrice: 2222.0, quantity: 0.10, pnl:  100, status: 'closed' },
          { symbol: 'XAUUSD', direction: 'long',  dayOffset: 9, entryPrice: 2225.0, exitPrice: 2235.0, quantity: 0.10, pnl:  100, status: 'closed' },
          { symbol: 'XAUUSD', direction: 'long',  dayOffset: 9, entryPrice: 2240.0, exitPrice: null,   quantity: 0.10, pnl: null, status: 'open' },
          { symbol: 'XAUUSD', direction: 'short', dayOffset: 9, entryPrice: 2245.0, exitPrice: null,   quantity: 0.10, pnl: null, status: 'cancelled' },
        ],
      },
      {
        name: 'Strategy 6',
        accountId: '66666666-6666-6666-6666-666666666666',
        // Stair-step pattern. Peak 300, last 300 → max DD 30, current DD 0.
        pnlSeries: [0, 100, 80, 150, 120, 200, 170, 250, 220, 300],
        trades: [
          { symbol: 'SPX500', direction: 'long',  dayOffset: 1, entryPrice: 5100.0, exitPrice: 5110.0, quantity: 0.10, pnl:  100, status: 'closed' },
          { symbol: 'SPX500', direction: 'short', dayOffset: 2, entryPrice: 5115.0, exitPrice: 5117.0, quantity: 0.10, pnl:  -20, status: 'closed' },
          { symbol: 'SPX500', direction: 'long',  dayOffset: 3, entryPrice: 5110.0, exitPrice: 5117.0, quantity: 0.10, pnl:  70,  status: 'closed' },
          { symbol: 'SPX500', direction: 'short', dayOffset: 4, entryPrice: 5125.0, exitPrice: 5128.0, quantity: 0.10, pnl:  -30, status: 'closed' },
          { symbol: 'SPX500', direction: 'long',  dayOffset: 5, entryPrice: 5120.0, exitPrice: 5128.0, quantity: 0.10, pnl:  80,  status: 'closed' },
          { symbol: 'SPX500', direction: 'short', dayOffset: 6, entryPrice: 5135.0, exitPrice: 5138.0, quantity: 0.10, pnl:  -30, status: 'closed' },
          { symbol: 'SPX500', direction: 'long',  dayOffset: 7, entryPrice: 5132.0, exitPrice: 5140.0, quantity: 0.10, pnl:  80,  status: 'closed' },
          { symbol: 'SPX500', direction: 'short', dayOffset: 8, entryPrice: 5145.0, exitPrice: 5148.0, quantity: 0.10, pnl:  -30, status: 'closed' },
          { symbol: 'SPX500', direction: 'long',  dayOffset: 9, entryPrice: 5145.0, exitPrice: 5153.0, quantity: 0.10, pnl:  80,  status: 'closed' },
          { symbol: 'SPX500', direction: 'long',  dayOffset: 9, entryPrice: 5155.0, exitPrice: null,   quantity: 0.10, pnl: null, status: 'open' },
          { symbol: 'SPX500', direction: 'short', dayOffset: 9, entryPrice: 5160.0, exitPrice: null,   quantity: 0.10, pnl: null, status: 'cancelled' },
        ],
      },
      {
        name: 'Strategy 7',
        accountId: '77777777-7777-7777-7777-777777777777',
        // Oscillating range. Peak 80, last 80 → max DD 30, current DD 0.
        pnlSeries: [0, 40, 20, 50, 30, 60, 40, 70, 50, 80],
        trades: [
          { symbol: 'USDJPY', direction: 'long',  dayOffset: 1, entryPrice: 148.50, exitPrice: 148.90, quantity: 0.20, pnl:  40,  status: 'closed' },
          { symbol: 'USDJPY', direction: 'short', dayOffset: 2, entryPrice: 149.20, exitPrice: 149.40, quantity: 0.20, pnl: -20,  status: 'closed' },
          { symbol: 'USDJPY', direction: 'long',  dayOffset: 3, entryPrice: 149.10, exitPrice: 149.40, quantity: 0.20, pnl:  30,  status: 'closed' },
          { symbol: 'USDJPY', direction: 'short', dayOffset: 4, entryPrice: 149.60, exitPrice: 149.80, quantity: 0.20, pnl: -20,  status: 'closed' },
          { symbol: 'USDJPY', direction: 'long',  dayOffset: 5, entryPrice: 149.70, exitPrice: 150.00, quantity: 0.20, pnl:  30,  status: 'closed' },
          { symbol: 'USDJPY', direction: 'short', dayOffset: 6, entryPrice: 150.20, exitPrice: 150.40, quantity: 0.20, pnl: -20,  status: 'closed' },
          { symbol: 'USDJPY', direction: 'long',  dayOffset: 7, entryPrice: 150.30, exitPrice: 150.60, quantity: 0.20, pnl:  30,  status: 'closed' },
          { symbol: 'USDJPY', direction: 'short', dayOffset: 8, entryPrice: 150.80, exitPrice: 151.00, quantity: 0.20, pnl: -20,  status: 'closed' },
          { symbol: 'USDJPY', direction: 'long',  dayOffset: 9, entryPrice: 150.90, exitPrice: 151.20, quantity: 0.20, pnl:  30,  status: 'closed' },
          { symbol: 'USDJPY', direction: 'long',  dayOffset: 9, entryPrice: 151.30, exitPrice: null,   quantity: 0.20, pnl: null, status: 'open' },
          { symbol: 'USDJPY', direction: 'short', dayOffset: 9, entryPrice: 151.40, exitPrice: null,   quantity: 0.20, pnl: null, status: 'cancelled' },
        ],
      },
      {
        name: 'Strategy 8',
        accountId: '88888888-8888-8888-8888-888888888888',
        // Volatile with big spikes. Peak 500, last 550 (new peak) → max DD 250, current DD 0.
        pnlSeries: [0, 200, 100, 350, 200, 450, 250, 500, 300, 550],
        trades: [
          { symbol: 'WTI', direction: 'long',  dayOffset: 1, entryPrice: 78.50, exitPrice: 80.50, quantity: 1.00, pnl:  200, status: 'closed' },
          { symbol: 'WTI', direction: 'short', dayOffset: 2, entryPrice: 80.30, exitPrice: 81.30, quantity: 1.00, pnl: -100, status: 'closed' },
          { symbol: 'WTI', direction: 'long',  dayOffset: 3, entryPrice: 80.80, exitPrice: 83.30, quantity: 1.00, pnl:  250, status: 'closed' },
          { symbol: 'WTI', direction: 'short', dayOffset: 4, entryPrice: 83.00, exitPrice: 84.50, quantity: 1.00, pnl: -150, status: 'closed' },
          { symbol: 'WTI', direction: 'long',  dayOffset: 5, entryPrice: 84.20, exitPrice: 86.70, quantity: 1.00, pnl:  250, status: 'closed' },
          { symbol: 'WTI', direction: 'short', dayOffset: 6, entryPrice: 86.30, exitPrice: 88.30, quantity: 1.00, pnl: -200, status: 'closed' },
          { symbol: 'WTI', direction: 'long',  dayOffset: 7, entryPrice: 87.80, exitPrice: 90.30, quantity: 1.00, pnl:  250, status: 'closed' },
          { symbol: 'WTI', direction: 'short', dayOffset: 8, entryPrice: 90.10, exitPrice: 92.10, quantity: 1.00, pnl: -200, status: 'closed' },
          { symbol: 'WTI', direction: 'long',  dayOffset: 9, entryPrice: 91.60, exitPrice: 94.10, quantity: 1.00, pnl:  250, status: 'closed' },
          { symbol: 'WTI', direction: 'long',  dayOffset: 9, entryPrice: 93.50, exitPrice: null,  quantity: 1.00, pnl: null, status: 'open' },
          { symbol: 'WTI', direction: 'short', dayOffset: 9, entryPrice: 94.20, exitPrice: null,  quantity: 1.00, pnl: null, status: 'cancelled' },
        ],
      },
      {
        name: 'Strategy 9',
        accountId: '99999999-9999-9999-9999-999999999999',
        // Moderate climb with mild pullbacks. Peak 230, last 230 → max DD 20, current DD 0.
        pnlSeries: [0, 50, 90, 70, 130, 110, 170, 150, 210, 230],
        trades: [
          { symbol: 'XAGUSD', direction: 'long',  dayOffset: 1, entryPrice: 26.50, exitPrice: 26.75, quantity: 2.00, pnl:  50,  status: 'closed' },
          { symbol: 'XAGUSD', direction: 'long',  dayOffset: 2, entryPrice: 26.80, exitPrice: 27.00, quantity: 2.00, pnl:  40,  status: 'closed' },
          { symbol: 'XAGUSD', direction: 'short', dayOffset: 3, entryPrice: 27.10, exitPrice: 27.20, quantity: 2.00, pnl: -20,  status: 'closed' },
          { symbol: 'XAGUSD', direction: 'long',  dayOffset: 4, entryPrice: 27.05, exitPrice: 27.35, quantity: 2.00, pnl:  60,  status: 'closed' },
          { symbol: 'XAGUSD', direction: 'short', dayOffset: 5, entryPrice: 27.40, exitPrice: 27.50, quantity: 2.00, pnl: -20,  status: 'closed' },
          { symbol: 'XAGUSD', direction: 'long',  dayOffset: 6, entryPrice: 27.45, exitPrice: 27.75, quantity: 2.00, pnl:  60,  status: 'closed' },
          { symbol: 'XAGUSD', direction: 'short', dayOffset: 7, entryPrice: 27.80, exitPrice: 27.90, quantity: 2.00, pnl: -20,  status: 'closed' },
          { symbol: 'XAGUSD', direction: 'long',  dayOffset: 8, entryPrice: 27.85, exitPrice: 28.15, quantity: 2.00, pnl:  60,  status: 'closed' },
          { symbol: 'XAGUSD', direction: 'long',  dayOffset: 9, entryPrice: 28.20, exitPrice: 28.30, quantity: 2.00, pnl:  20,  status: 'closed' },
          { symbol: 'XAGUSD', direction: 'long',  dayOffset: 9, entryPrice: 28.35, exitPrice: null,  quantity: 2.00, pnl: null, status: 'open' },
          { symbol: 'XAGUSD', direction: 'short', dayOffset: 9, entryPrice: 28.40, exitPrice: null,  quantity: 2.00, pnl: null, status: 'cancelled' },
        ],
      },
      {
        name: 'Strategy 10',
        accountId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        // Steady linear growth. Peak 270, last 270 → max DD 0, current DD 0.
        pnlSeries: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270],
        trades: [
          { symbol: 'USDCHF', direction: 'long',  dayOffset: 1, entryPrice: 0.8800, exitPrice: 0.8815, quantity: 1.00, pnl:  15,  status: 'closed' },
          { symbol: 'USDCHF', direction: 'short', dayOffset: 2, entryPrice: 0.8825, exitPrice: 0.8810, quantity: 1.00, pnl:  15,  status: 'closed' },
          { symbol: 'USDCHF', direction: 'long',  dayOffset: 3, entryPrice: 0.8815, exitPrice: 0.8830, quantity: 1.00, pnl:  15,  status: 'closed' },
          { symbol: 'USDCHF', direction: 'short', dayOffset: 4, entryPrice: 0.8840, exitPrice: 0.8825, quantity: 1.00, pnl:  15,  status: 'closed' },
          { symbol: 'USDCHF', direction: 'long',  dayOffset: 5, entryPrice: 0.8830, exitPrice: 0.8845, quantity: 1.00, pnl:  15,  status: 'closed' },
          { symbol: 'USDCHF', direction: 'short', dayOffset: 6, entryPrice: 0.8855, exitPrice: 0.8840, quantity: 1.00, pnl:  15,  status: 'closed' },
          { symbol: 'USDCHF', direction: 'long',  dayOffset: 7, entryPrice: 0.8845, exitPrice: 0.8860, quantity: 1.00, pnl:  15,  status: 'closed' },
          { symbol: 'USDCHF', direction: 'short', dayOffset: 8, entryPrice: 0.8870, exitPrice: 0.8855, quantity: 1.00, pnl:  15,  status: 'closed' },
          { symbol: 'USDCHF', direction: 'long',  dayOffset: 9, entryPrice: 0.8860, exitPrice: 0.8875, quantity: 1.00, pnl:  15,  status: 'closed' },
          { symbol: 'USDCHF', direction: 'long',  dayOffset: 9, entryPrice: 0.8880, exitPrice: null,   quantity: 1.00, pnl: null, status: 'open' },
          { symbol: 'USDCHF', direction: 'short', dayOffset: 9, entryPrice: 0.8885, exitPrice: null,   quantity: 1.00, pnl: null, status: 'cancelled' },
        ],
      },
    ];

    return this.sequelize.transaction(async (tx) => {
      const lockAcquired = await this.tryAcquireWriteLock(tx);
      if (!lockAcquired) {
        // Another seed run, or the daily strategy-sync cron, is holding
        // the write lock. Bail out so we never half-cleanup the table.
        this.logger.warn(
          'seedDevData skipped: write lock held by another transaction (seed or strategy-sync in flight).',
        );
        throw new ConflictException(
          'A seed or strategy-sync run is already in progress. Try again in a moment.',
        );
      }

      await this.cleanupAllStrategiesTx(tx);

      // Insert all 10 strategies in one round-trip and capture the
      // generated UUIDs. `returning: true` is needed on Postgres so
      // `bulkCreate` populates each instance's `id` for us to use as
      // the FK on the snapshots + trades below.
      const createdStrategies = await this.strategyModel.bulkCreate(
        SEEDS.map((s) => ({ name: s.name, status: 'active' })),
        { transaction: tx, returning: true },
      );

      const allSnapshots: Array<Record<string, unknown>> = [];
      const allTrades: Array<Record<string, unknown>> = [];
      const results: SeedResultDto[] = [];

      for (let s = 0; s < SEEDS.length; s++) {
        const seed = SEEDS[s];
        const strategyId = createdStrategies[s].id;

        let runningPeak = -Infinity;
        for (let i = 0; i < seed.pnlSeries.length; i++) {
          const v = seed.pnlSeries[i];
          if (v > runningPeak) runningPeak = v;
          const currentDrawdown = runningPeak - v;
          const ts = this.addDays(dayOne, i);
          allSnapshots.push({
            strategy_id: strategyId,
            account_id: seed.accountId,
            timestamp: ts,
            total_trades: 0,
            winning_trades: 0,
            losing_trades: 0,
            win_rate: 0,
            total_pnl: v,
            unrealized_pnl: 0,
            realized_pnl: v,
            max_drawdown: 0,
            current_drawdown: currentDrawdown,
            // `last_updated` intentionally omitted: the
            // `sync_real_time_strategies` Postgres trigger / column
            // default owns this value. See strategy-sync.service.ts.
          });
        }

        for (const t of seed.trades) {
          const entry = this.addDays(dayOne, t.dayOffset);
          const exit =
            t.exitPrice !== null
              ? new Date(entry.getTime() + 60 * 60 * 1000)
              : null;
          allTrades.push({
            trade_id: randomUUID(),
            strategy_id: strategyId,
            account_id: seed.accountId,
            symbol: t.symbol,
            direction: t.direction,
            entry_time: entry,
            entry_price: t.entryPrice,
            exit_time: exit,
            exit_price: t.exitPrice,
            quantity: t.quantity,
            pnl: t.pnl,
            status: t.status,
          });
        }

        const closed = seed.trades.filter((t) => t.status === 'closed').length;
        const open = seed.trades.filter((t) => t.status === 'open').length;
        const cancelled = seed.trades.filter(
          (t) => t.status === 'cancelled',
        ).length;

        results.push({
          name: seed.name,
          strategyId,
          snapshotsInserted: seed.pnlSeries.length,
          tradesInserted: seed.trades.length,
          closedTrades: closed,
          openTrades: open,
          cancelledTrades: cancelled,
          dayOne: dayOne.toISOString(),
          performanceUrl: `/strategies/${strategyId}/performance`,
          publicSummaryUrl: `/strategies/public/${strategyId}/summary`,
        });
      }

      // Two bulk inserts, one round-trip each. Far fewer queries than
      // the old per-row loop, which also reduces the window where a
      // concurrent sync could observe a partial dataset (even though
      // the lock already prevents that).
      if (allSnapshots.length) {
        await this.strategyPerformanceModel.bulkCreate(allSnapshots as never, {
          transaction: tx,
          validate: true,
        });
      }
      if (allTrades.length) {
        await this.tradeModel.bulkCreate(allTrades as never, {
          transaction: tx,
          validate: true,
        });
      }

      this.logger.log(
        `Seeded ${results.length} strategies, ` +
          `${allSnapshots.length} snapshots, ` +
          `${allTrades.length} trades in one transaction.`,
      );

      return results;
    });
  }

  /**
   * Try to grab the cross-process write lock for the duration of the
   * given transaction. Returns false if another transaction (a sync
   * run, a parallel seed) is currently holding it. Auto-released by
   * Postgres on COMMIT or ROLLBACK — no manual cleanup required.
   */
  private async tryAcquireWriteLock(tx: Transaction): Promise<boolean> {
    const rows = await this.sequelize.query<{ locked: boolean }>(
      'SELECT pg_try_advisory_xact_lock(:key) AS locked',
      {
        transaction: tx,
        replacements: { key: STRATEGY_WRITE_LOCK_KEY },
        type: QueryTypes.SELECT,
      },
    );
    return rows[0]?.locked === true;
  }

  private parseDayOne(iso?: string): Date {
    const raw = iso ?? '2024-04-20';
    const parsed = new Date(
      raw.length === 10 ? `${raw}T00:00:00.000Z` : raw,
    );
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(
        `Invalid dayOne value: "${raw}" (expected YYYY-MM-DD or ISO datetime)`,
      );
    }
    return parsed;
  }

  private addDays(base: Date, days: number): Date {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
  }

  /**
   * Delete every strategy and its dependent rows inside the given
   * transaction. The order matters only for readability — there are no
   * FK cascades in this schema. Real-time mirror tables (`real_time_*`)
   * are populated by Postgres triggers on INSERT/UPDATE only, so we
   * have to wipe them by hand.
   *
   * Always call this from within a transaction that holds
   * `STRATEGY_WRITE_LOCK_KEY`, so a concurrent sync cannot insert new
   * rows between the DELETEs and the bulk INSERTs that follow.
   */
  private async cleanupAllStrategiesTx(tx: Transaction): Promise<void> {
    const existing = await this.strategyModel.findAll({
      attributes: ['id'],
      transaction: tx,
    });
    if (existing.length === 0) return;

    const ids = existing.map((s) => s.id);
    const where = { strategy_id: { [Op.in]: ids } };
    await this.strategyPerformanceModel.destroy({ where, transaction: tx });
    await this.realTimeStrategyModel.destroy({ where, transaction: tx });
    await this.tradeModel.destroy({ where, transaction: tx });
    await this.realTimeTradeModel.destroy({ where, transaction: tx });
    await this.strategyModel.destroy({
      where: { id: { [Op.in]: ids } },
      transaction: tx,
    });
  }
}

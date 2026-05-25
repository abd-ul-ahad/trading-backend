import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
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

@Injectable()
export class StrategyService {
  private readonly logger = new Logger(StrategyService.name);

  constructor(
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

      const trades = await this.tradeModel.findAll({
        where: {
          strategy_id: strategyId,
          entry_time: { [Op.gte]: day1 },
        },
      });

      const totalTrades = trades.length;
      const closedTrades = trades.filter((t) => t.status === 'closed');
      const winningTrades = closedTrades.filter(
        (t) => Number(t.pnl ?? 0) > 0,
      ).length;
      const losingTrades = closedTrades.filter(
        (t) => Number(t.pnl ?? 0) < 0,
      ).length;
      const winRate =
        closedTrades.length > 0 ? winningTrades / closedTrades.length : 0;

      const snapshots = await this.strategyPerformanceModel.findAll({
        where: {
          strategy_id: strategyId,
          timestamp: { [Op.gte]: day1 },
        },
        order: [['timestamp', 'ASC']],
        attributes: ['timestamp', 'total_pnl'],
      });

      let peak = -Infinity;
      let maxDrawdown = 0;
      let currentDrawdown = 0;
      for (const snap of snapshots) {
        const v = Number(snap.total_pnl);
        if (v > peak) peak = v;
        const dd = peak - v;
        if (dd > maxDrawdown) maxDrawdown = dd;
        currentDrawdown = dd;
      }

      return {
        strategyId,
        totalPnL: parseFloat(totalPnL.toFixed(8)),
        unrealizedPnL: parseFloat(unrealizedPnL.toFixed(8)),
        realizedPnL: parseFloat(realizedPnL.toFixed(8)),
        winRate: parseFloat(winRate.toFixed(4)),
        totalTrades,
        winningTrades,
        losingTrades,
        maxDrawdown: parseFloat(maxDrawdown.toFixed(8)),
        currentDrawdown: parseFloat(currentDrawdown.toFixed(8)),
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
   * Wipes any existing strategies that share a seed name (and their snapshots,
   * trades, and real-time rows), then creates fresh strategies with realistic
   * performance snapshots and trades. The sync triggers auto-populate the
   * `real_time_*` tables, so we don't write to them directly.
   *
   * The controller is responsible for refusing to run this in production.
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

    const SEEDS: StrategySeed[] = [
      {
        name: 'Momentum EUR/USD',
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
        name: 'Mean Reversion DAX',
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
    ];

    const names = SEEDS.map((s) => s.name);
    await this.cleanupSeedByNames(names);

    const results: SeedResultDto[] = [];

    for (const seed of SEEDS) {
      const strategy = await this.create({ name: seed.name });
      const strategyId = strategy.id;

      let runningPeak = -Infinity;
      for (let i = 0; i < seed.pnlSeries.length; i++) {
        const v = seed.pnlSeries[i];
        if (v > runningPeak) runningPeak = v;
        const currentDrawdown = runningPeak - v;
        const ts = this.addDays(dayOne, i);
        await this.strategyPerformanceModel.create({
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
          last_updated: ts,
        });
      }

      for (const t of seed.trades) {
        const entry = this.addDays(dayOne, t.dayOffset);
        const exit =
          t.exitPrice !== null
            ? new Date(entry.getTime() + 60 * 60 * 1000)
            : null;
        await this.tradeModel.create({
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
          last_updated: new Date(),
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

      this.logger.log(
        `Seeded strategy "${seed.name}" (${strategyId}) with ${seed.pnlSeries.length} snapshots and ${seed.trades.length} trades.`,
      );
    }

    return results;
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

  private async cleanupSeedByNames(names: string[]): Promise<void> {
    const existing = await this.strategyModel.findAll({
      where: { name: { [Op.in]: names } },
      attributes: ['id'],
    });
    if (existing.length === 0) return;

    const ids = existing.map((s) => s.id);
    // No FK cascades exist between these tables, so we delete everything
    // explicitly (including the real-time mirrors, which the sync triggers
    // only update on INSERT/UPDATE — not on DELETE).
    await this.strategyPerformanceModel.destroy({
      where: { strategy_id: { [Op.in]: ids } },
    });
    await this.realTimeStrategyModel.destroy({
      where: { strategy_id: { [Op.in]: ids } },
    });
    await this.tradeModel.destroy({
      where: { strategy_id: { [Op.in]: ids } },
    });
    await this.realTimeTradeModel.destroy({
      where: { strategy_id: { [Op.in]: ids } },
    });
    await this.strategyModel.destroy({ where: { id: { [Op.in]: ids } } });
  }
}

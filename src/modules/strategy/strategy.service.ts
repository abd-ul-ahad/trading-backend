import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Strategy } from '../../database/models/strategy.model';
import { Trade } from '../../database/models/trade.model';
import { StrategyPerformance } from '../../database/models/strategy-performance.model';
import { RealTimeStrategy } from '../../database/models/real-time-strategy.model';
import { CreateStrategyDto, UpdateStrategyDto } from './dto';
import { StrategyPerformanceDto } from './dto/strategy-performance.dto';
import { PublicStrategySummaryDto } from './dto/public-strategy-summary.dto';
import { EquityCurvePointDto } from './dto/equity-curve.dto';

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
  ) {}

  /**
   * Create a new strategy
   */
  async create(dto: CreateStrategyDto): Promise<Strategy> {
    if (dto.initial_capital <= 0) {
      throw new BadRequestException('Initial capital must be greater than 0');
    }

    try {
      const strategy = await this.strategyModel.create({
        name: dto.name,
        description: dto.description || null,
        account_id: dto.account_id,
        initial_capital: dto.initial_capital,
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
   * Get all strategies
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
   * Get strategies by account ID
   */
  async findByAccountId(accountId: string): Promise<Strategy[]> {
    try {
      return await this.strategyModel.findAll({
        where: { account_id: accountId },
        order: [['createdAt', 'DESC']],
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch strategies for account ${accountId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get a single strategy by ID
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
   * Update a strategy
   */
  async update(id: string, dto: UpdateStrategyDto): Promise<Strategy> {
    try {
      const strategy = await this.findById(id);

      if (dto.name !== undefined) {
        strategy.name = dto.name;
      }
      if (dto.description !== undefined) {
        strategy.description = dto.description;
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
   * Delete a strategy
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
   * Get live performance for a strategy
   * Calculates performance metrics from trades and real-time data
   */
  async getPerformance(strategyId: string): Promise<StrategyPerformanceDto> {
    try {
      const strategy = await this.findById(strategyId);

      // Get all trades for this strategy
      const trades = await this.tradeModel.findAll({
        where: { strategy_id: strategyId },
      });

      // Get latest real-time strategy data
      const realTimeData =
        await this.realTimeStrategyModel.findByPk(strategyId);

      // Calculate performance metrics
      const totalTrades = trades.length;
      const closedTrades = trades.filter((t) => t.status === 'closed');
      const winningTrades = closedTrades.filter((t) => (t.pnl || 0) > 0).length;
      const losingTrades = closedTrades.filter((t) => (t.pnl || 0) < 0).length;

      const totalPnL = realTimeData?.total_pnl || 0;
      const unrealizedPnL = realTimeData?.unrealized_pnl || 0;
      const realizedPnL = totalPnL - unrealizedPnL;

      const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
      const totalReturn = (totalPnL / strategy.initial_capital) * 100;
      const maxDrawdown = realTimeData?.current_drawdown || 0;

      return {
        strategyId,
        totalReturn: parseFloat(totalReturn.toFixed(2)),
        totalPnL: parseFloat(totalPnL.toString()),
        unrealizedPnL: parseFloat(unrealizedPnL.toString()),
        realizedPnL: parseFloat(realizedPnL.toString()),
        winRate: parseFloat(winRate.toFixed(4)),
        totalTrades,
        winningTrades,
        losingTrades,
        maxDrawdown: parseFloat(maxDrawdown.toString()),
        currentDrawdown: parseFloat(maxDrawdown.toString()),
        lastUpdated: realTimeData?.last_updated || new Date(),
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
   * Get public summary for a strategy (no capital info)
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
        totalReturn: performance.totalReturn,
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
   * Get all trades for a strategy
   */
  async getTrades(
    strategyId: string,
    limit: number = 50,
    offset: number = 0,
    status?: string,
  ): Promise<{ trades: Trade[]; total: number }> {
    try {
      await this.findById(strategyId); // Verify strategy exists

      const where: any = { strategy_id: strategyId };
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
   * Get equity curve for a strategy
   * Returns historical equity progression
   */
  async getEquityCurve(
    strategyId: string,
    days: number = 30,
  ): Promise<EquityCurvePointDto[]> {
    try {
      const strategy = await this.findById(strategyId);

      // Get performance snapshots from the last N days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const performances = await this.strategyPerformanceModel.findAll({
        where: {
          strategy_id: strategyId,
          timestamp: {
            [require('sequelize').Op.gte]: startDate,
          },
        },
        order: [['timestamp', 'ASC']],
      });

      // Convert to equity curve points
      return performances.map((perf) => ({
        timestamp: perf.timestamp,
        equity: strategy.initial_capital + perf.total_pnl,
        totalPnL: perf.total_pnl,
        drawdown: perf.current_drawdown,
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
}

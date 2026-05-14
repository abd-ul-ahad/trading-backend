import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { RealTimeTrade } from '../../database/models/real-time-trade.model';
import { AccountPerformance } from '../../database/models/account-performance.model';
import { StrategyPerformance } from '../../database/models/strategy-performance.model';
import { AnalyticsResponse } from './interfaces';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(RealTimeTrade)
    private readonly realTimeTradeModel: typeof RealTimeTrade,
    @InjectModel(AccountPerformance)
    private readonly accountPerformanceModel: typeof AccountPerformance,
    @InjectModel(StrategyPerformance)
    private readonly strategyPerformanceModel: typeof StrategyPerformance,
  ) {}

  async getAccountAnalytics(
    accountId: string,
    startDate: Date,
    endDate: Date,
    strategyId?: string,
  ): Promise<AnalyticsResponse> {
    if (startDate > endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    this.logger.log(
      `Fetching analytics for account ${accountId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    // Build where clause for trades
    const tradeWhereClause: any = {
      account_id: accountId,
      entry_time: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (strategyId) {
      tradeWhereClause.strategy_id = strategyId;
    }

    // Get trade statistics
    const trades = await this.realTimeTradeModel.findAll({
      where: tradeWhereClause,
      attributes: ['trade_id', 'status', 'entry_time'],
    });

    const totalTrades = trades.length;
    const closedTrades = trades.filter((t) => t.status === 'closed');
    const openTrades = trades.filter((t) => t.status === 'open');

    // Get performance data for the period
    const performanceWhereClause: any = {
      account_id: accountId,
      timestamp: {
        [Op.between]: [startDate, endDate],
      },
    };

    // Get latest account performance snapshot in the period
    const latestAccountPerformance = await this.accountPerformanceModel.findOne({
      where: performanceWhereClause,
      order: [['timestamp', 'DESC']],
    });

    // Get earliest account performance snapshot for baseline
    const earliestAccountPerformance = await this.accountPerformanceModel.findOne({
      where: performanceWhereClause,
      order: [['timestamp', 'ASC']],
    });

    // Calculate realized and unrealized PnL
    const realizedPnL = latestAccountPerformance
      ? parseFloat(latestAccountPerformance.realized_pnl.toString())
      : 0;
    const unrealizedPnL = latestAccountPerformance
      ? parseFloat(latestAccountPerformance.unrealized_pnl.toString())
      : 0;
    const totalPnL = realizedPnL + unrealizedPnL;

    // Calculate return percentages based on initial balance
    const initialBalance = earliestAccountPerformance
      ? parseFloat(earliestAccountPerformance.balance.toString())
      : 0;

    const realizedReturnPercent =
      initialBalance > 0 ? (realizedPnL / initialBalance) * 100 : 0;
    const unrealizedReturnPercent =
      initialBalance > 0 ? (unrealizedPnL / initialBalance) * 100 : 0;

    // Get drawdown metrics
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let maxDrawdownDate: string | null = null;

    if (strategyId) {
      // Get strategy-specific drawdown
      const strategyPerformance = await this.strategyPerformanceModel.findOne({
        where: {
          account_id: accountId,
          strategy_id: strategyId,
          timestamp: {
            [Op.between]: [startDate, endDate],
          },
        },
        order: [['timestamp', 'DESC']],
      });

      if (strategyPerformance) {
        maxDrawdown = parseFloat(strategyPerformance.max_drawdown.toString());
        currentDrawdown = parseFloat(
          strategyPerformance.current_drawdown.toString(),
        );
      }

      // Find the date of max drawdown
      const maxDrawdownRecord = await this.strategyPerformanceModel.findOne({
        where: {
          account_id: accountId,
          strategy_id: strategyId,
          timestamp: {
            [Op.between]: [startDate, endDate],
          },
        },
        order: [['max_drawdown', 'ASC']], // Most negative value
      });

      if (maxDrawdownRecord) {
        maxDrawdownDate = maxDrawdownRecord.timestamp.toISOString();
      }
    } else {
      // Get account-level drawdown
      if (latestAccountPerformance) {
        currentDrawdown = parseFloat(
          latestAccountPerformance.drawdown.toString(),
        );
      }

      // Find max drawdown in the period
      const allPerformanceSnapshots = await this.accountPerformanceModel.findAll(
        {
          where: performanceWhereClause,
          attributes: ['drawdown', 'timestamp'],
          order: [['drawdown', 'ASC']], // Most negative value first
        },
      );

      if (allPerformanceSnapshots.length > 0) {
        const maxDrawdownSnapshot = allPerformanceSnapshots[0];
        maxDrawdown = parseFloat(maxDrawdownSnapshot.drawdown.toString());
        maxDrawdownDate = maxDrawdownSnapshot.timestamp.toISOString();
      }
    }

    // Calculate win/loss statistics from strategy performance if available
    let winningTrades = 0;
    let losingTrades = 0;
    let winRate = 0;

    if (strategyId) {
      const strategyPerformance = await this.strategyPerformanceModel.findOne({
        where: {
          account_id: accountId,
          strategy_id: strategyId,
          timestamp: {
            [Op.between]: [startDate, endDate],
          },
        },
        order: [['timestamp', 'DESC']],
      });

      if (strategyPerformance) {
        winningTrades = strategyPerformance.winning_trades;
        losingTrades = strategyPerformance.losing_trades;
        winRate = parseFloat(strategyPerformance.win_rate.toString());
      }
    } else {
      // Aggregate across all strategies
      const allStrategyPerformances =
        await this.strategyPerformanceModel.findAll({
          where: {
            account_id: accountId,
            timestamp: {
              [Op.between]: [startDate, endDate],
            },
          },
          order: [['timestamp', 'DESC']],
        });

      // Get the latest snapshot for each strategy
      const latestByStrategy = new Map<string, StrategyPerformance>();
      for (const perf of allStrategyPerformances) {
        if (!latestByStrategy.has(perf.strategy_id)) {
          latestByStrategy.set(perf.strategy_id, perf);
        }
      }

      // Sum up winning and losing trades
      for (const perf of latestByStrategy.values()) {
        winningTrades += perf.winning_trades;
        losingTrades += perf.losing_trades;
      }

      // Calculate overall win rate
      const totalCompletedTrades = winningTrades + losingTrades;
      winRate =
        totalCompletedTrades > 0 ? winningTrades / totalCompletedTrades : 0;
    }

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      trades: {
        total: totalTrades,
        winning: winningTrades,
        losing: losingTrades,
        winRate: parseFloat(winRate.toFixed(4)),
      },
      returns: {
        realizedPnL: parseFloat(realizedPnL.toFixed(2)),
        unrealizedPnL: parseFloat(unrealizedPnL.toFixed(2)),
        totalPnL: parseFloat(totalPnL.toFixed(2)),
        realizedReturnPercent: parseFloat(realizedReturnPercent.toFixed(2)),
        unrealizedReturnPercent: parseFloat(unrealizedReturnPercent.toFixed(2)),
      },
      drawdown: {
        maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
        currentDrawdown: parseFloat(currentDrawdown.toFixed(2)),
        maxDrawdownDate,
      },
    };
  }
}

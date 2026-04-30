import {
  Table,
  Column,
  DataType,
} from 'sequelize-typescript';
import { BaseModel } from './base.model';

/**
 * StrategyPerformance model representing historical strategy performance snapshots
 * 
 * Stores intraday and end-of-day snapshots of strategy-level performance metrics.
 * Automatically synchronized to real_time_strategies table via PostgreSQL triggers.
 * 
 * Features:
 * - UUID primary key (id from BaseModel)
 * - Integer counters for trade statistics
 * - Decimal precision for win rate (5, 4)
 * - Decimal precision for PnL metrics (18, 8)
 * - Decimal precision for drawdown metrics (10, 4)
 * - Automatic timestamp management via triggers (last_updated)
 * - Soft delete support (inherited from BaseModel)
 * 
 * Requirements: 11.3, 11.7
 */
@Table({
  tableName: 'strategy_performance',
  timestamps: true,
  paranoid: false,
  underscored: true, // maps createdAt → created_at, updatedAt → updated_at
})
export class StrategyPerformance extends BaseModel {
  /**
   * Strategy identifier
   * References the strategy for this performance snapshot
   */
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare strategy_id: string;

  /**
   * Account identifier
   * References the account where this strategy is running
   */
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare account_id: string;

  /**
   * Snapshot timestamp
   * When this performance snapshot was captured
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare timestamp: Date;

  /**
   * Total trades
   * Total number of trades executed by this strategy
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare total_trades: number;

  /**
   * Winning trades
   * Number of trades that resulted in profit
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare winning_trades: number;

  /**
   * Losing trades
   * Number of trades that resulted in loss
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare losing_trades: number;

  /**
   * Win rate
   * Percentage of winning trades (winning_trades / total_trades)
   * Precision: 5 total digits, 4 decimal places (supports 0.0000 to 1.0000)
   */
  @Column({
    type: DataType.DECIMAL(5, 4),
    allowNull: false,
    defaultValue: 0,
  })
  declare win_rate: number;

  /**
   * Total profit and loss
   * Sum of unrealized and realized PnL for this strategy
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
    defaultValue: 0,
  })
  declare total_pnl: number;

  /**
   * Unrealized profit and loss
   * PnL from open positions for this strategy
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
    defaultValue: 0,
  })
  declare unrealized_pnl: number;

  /**
   * Realized profit and loss
   * PnL from closed positions for this strategy
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
    defaultValue: 0,
  })
  declare realized_pnl: number;

  /**
   * Maximum drawdown
   * Largest peak-to-trough decline in strategy equity
   * Precision: 10 total digits, 4 decimal places
   */
  @Column({
    type: DataType.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 0,
  })
  declare max_drawdown: number;

  /**
   * Current drawdown
   * Current drawdown percentage from peak equity
   * Precision: 10 total digits, 4 decimal places
   */
  @Column({
    type: DataType.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 0,
  })
  declare current_drawdown: number;

  /**
   * Last updated timestamp
   * Automatically managed by PostgreSQL trigger (update_last_updated_column)
   * Used for efficient "latest state" queries
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare last_updated: Date;
}

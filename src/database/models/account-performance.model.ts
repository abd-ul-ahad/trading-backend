import { Table, Column, DataType, Default } from 'sequelize-typescript';
import { BaseModel } from './base.model';

/**
 * AccountPerformance model representing historical account performance snapshots
 *
 * Stores intraday and end-of-day snapshots of account equity, margin, and PnL for trend analysis.
 * Automatically synchronized to real_time_accounts table via PostgreSQL triggers.
 *
 * Features:
 * - UUID primary key (id from BaseModel)
 * - Decimal precision for financial metrics (18, 8)
 * - Decimal precision for percentages (10, 4)
 * - Automatic timestamp management via triggers (last_updated)
 * - Validation for margin_level range (0-1000)
 * - Soft delete support (inherited from BaseModel)
 *
 * Requirements: 11.2, 11.7
 */
@Table({
  tableName: 'account_performance',
  timestamps: true,
  paranoid: false,
  underscored: true, // maps createdAt → created_at, updatedAt → updated_at
})
export class AccountPerformance extends BaseModel {
  /**
   * Account identifier
   * References the account for this performance snapshot
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
   * Account balance
   * Total cash balance in the account
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
  })
  declare balance: number;

  /**
   * Account equity
   * Total account value including open positions
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
  })
  declare equity: number;

  /**
   * Margin used
   * Amount of margin currently used by open positions
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
  })
  declare margin_used: number;

  /**
   * Margin available
   * Amount of margin available for new positions
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
  })
  declare margin_available: number;

  /**
   * Margin level
   * Percentage of equity to margin used (equity / margin_used * 100)
   * Precision: 10 total digits, 4 decimal places
   * Valid range: 0 to 1000 (0% to 100000%)
   */
  @Column({
    type: DataType.DECIMAL(10, 4),
    allowNull: false,
    validate: {
      min: 0,
      max: 1000,
    },
  })
  declare margin_level: number;

  /**
   * Unrealized profit and loss
   * PnL from open positions
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
  })
  declare unrealized_pnl: number;

  /**
   * Realized profit and loss
   * PnL from closed positions
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
  })
  declare realized_pnl: number;

  /**
   * Total profit and loss
   * Sum of unrealized and realized PnL
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
  })
  declare total_pnl: number;

  /**
   * Drawdown
   * Current drawdown percentage from peak equity
   * Precision: 10 total digits, 4 decimal places
   */
  @Column({
    type: DataType.DECIMAL(10, 4),
    allowNull: false,
  })
  declare drawdown: number;

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

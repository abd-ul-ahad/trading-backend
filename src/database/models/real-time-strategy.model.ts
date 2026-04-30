import {
  Table,
  Column,
  DataType,
  PrimaryKey,
  Model,
} from 'sequelize-typescript';

/**
 * RealTimeStrategy model representing live strategy monitoring data
 * 
 * Stores only the most recent state for each strategy (single row per strategy).
 * Automatically synchronized from the strategy_performance table via PostgreSQL triggers.
 * 
 * Features:
 * - UUID primary key (strategy_id)
 * - Single row per strategy (upsert pattern)
 * - Decimal precision for PnL metrics (18, 8)
 * - Decimal precision for drawdown (10, 4)
 * - Automatic synchronization via PostgreSQL triggers
 * - Read-only from application perspective (managed by triggers)
 * - Extends Model directly (not BaseModel) since it uses strategy_id as PK and doesn't have standard timestamps
 * 
 * Requirements: 11.6, 11.7
 */
@Table({
  tableName: 'real_time_strategies',
  timestamps: false, // No createdAt/updatedAt - uses last_updated instead
})
export class RealTimeStrategy extends Model {
  /**
   * Strategy identifier
   * Primary key for the strategy
   */
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    field: 'strategy_id',
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
   * Automatically managed by PostgreSQL trigger (sync_real_time_strategies)
   * Used for tracking when the strategy state was last synchronized
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare last_updated: Date;
}

import {
  Table,
  Column,
  DataType,
  PrimaryKey,
  Model,
} from 'sequelize-typescript';

/**
 * RealTimeAccount model representing live account monitoring data
 * 
 * Stores only the most recent state for each account (single row per account).
 * Automatically synchronized from the account_performance table via PostgreSQL triggers.
 * 
 * Features:
 * - UUID primary key (account_id)
 * - Single row per account (upsert pattern)
 * - Decimal precision for financial metrics (18, 8)
 * - Decimal precision for percentages (10, 4)
 * - Automatic synchronization via PostgreSQL triggers
 * - Read-only from application perspective (managed by triggers)
 * - Extends Model directly (not BaseModel) since it uses account_id as PK and doesn't have standard timestamps
 * - Validation for margin_level range (0-1000)
 * 
 * Requirements: 11.5, 11.7
 */
@Table({
  tableName: 'real_time_accounts',
  timestamps: false, // No createdAt/updatedAt - uses last_updated instead
})
export class RealTimeAccount extends Model {
  /**
   * Account identifier
   * Primary key for the account
   */
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    field: 'account_id',
  })
  declare account_id: string;

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
   * Last updated timestamp
   * Automatically managed by PostgreSQL trigger (sync_real_time_accounts)
   * Used for tracking when the account state was last synchronized
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare last_updated: Date;
}

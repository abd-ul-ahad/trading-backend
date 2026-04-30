import {
  Table,
  Column,
  DataType,
  PrimaryKey,
  Default,
  Model,
} from 'sequelize-typescript';

/**
 * TypeScript enums for RealTimeTrade model
 * Reusing the same enums as Trade model for consistency
 */
export enum TradeDirection {
  LONG = 'long',
  SHORT = 'short',
}

export enum TradeStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

/**
 * RealTimeTrade model representing live trade monitoring data
 * 
 * Stores only open trades and recently closed trades (24hr window) for live dashboard queries.
 * Automatically synchronized from the trades table via PostgreSQL triggers.
 * 
 * Features:
 * - UUID primary key (trade_id) - references trades.trade_id
 * - Minimal columns for fast queries (no exit_price, pnl)
 * - Decimal precision for prices and quantities (18, 8)
 * - Automatic synchronization via PostgreSQL triggers
 * - Read-only from application perspective (managed by triggers)
 * - Extends Model directly (not BaseModel) since it uses trade_id as PK and doesn't have standard timestamps
 * 
 * Requirements: 11.4, 11.7
 */
@Table({
  tableName: 'real_time_trades',
  timestamps: false, // No createdAt/updatedAt - uses last_updated instead
})
export class RealTimeTrade extends Model {
  /**
   * Unique trade identifier
   * Primary key referencing trades.trade_id
   */
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    field: 'trade_id',
  })
  declare trade_id: string;

  /**
   * Strategy identifier
   * References the strategy that executed this trade
   */
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare strategy_id: string;

  /**
   * Account identifier
   * References the account where this trade was executed
   */
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare account_id: string;

  /**
   * Trading symbol
   * Stock ticker, forex pair, or crypto symbol (e.g., 'AAPL', 'EUR/USD', 'BTC/USD')
   */
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  declare symbol: string;

  /**
   * Trade direction
   * 'long' for buy positions, 'short' for sell positions
   */
  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    validate: {
      isIn: [[TradeDirection.LONG, TradeDirection.SHORT]],
    },
  })
  declare direction: TradeDirection;

  /**
   * Entry timestamp
   * When the trade was opened
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare entry_time: Date;

  /**
   * Entry price
   * Price at which the position was opened
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
  })
  declare entry_price: number;

  /**
   * Trade quantity
   * Number of units/shares/contracts traded
   * Precision: 18 total digits, 8 decimal places (supports fractional shares and crypto)
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
  })
  declare quantity: number;

  /**
   * Trade status
   * 'open' - position is currently open
   * 'closed' - position has been closed (kept for 24 hours)
   * 'cancelled' - trade was cancelled
   */
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    validate: {
      isIn: [[TradeStatus.OPEN, TradeStatus.CLOSED, TradeStatus.CANCELLED]],
    },
  })
  declare status: TradeStatus;

  /**
   * Last updated timestamp
   * Automatically managed by PostgreSQL trigger (sync_real_time_trades)
   * Used for efficient "recent changes" queries
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare last_updated: Date;
}

import {
  Table,
  Column,
  DataType,
  PrimaryKey,
  Default,
  Model,
} from 'sequelize-typescript';

/**
 * TypeScript enums for Trade model
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
 * Trade model representing historical trade records
 *
 * The trades table uses trade_id as its primary key (not the standard id from BaseModel),
 * so this model extends Model directly. Timestamps are mapped to snake_case via underscored: true.
 * Note: soft delete (paranoid) is not supported — the trades table has no deleted_at column.
 *
 * Requirements: 11.1, 11.7
 */
@Table({
  tableName: 'trades',
  timestamps: true,
  paranoid: false,
  underscored: true, // maps createdAt → created_at, updatedAt → updated_at
})
export class Trade extends Model {
  /**
   * Unique trade identifier — primary key for this table
   */
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    field: 'trade_id',
  })
  declare trade_id: string;

  @Column({ type: DataType.UUID, allowNull: false })
  declare strategy_id: string;

  @Column({ type: DataType.UUID, allowNull: false })
  declare account_id: string;

  @Column({ type: DataType.STRING(20), allowNull: false })
  declare symbol: string;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    validate: { isIn: [[TradeDirection.LONG, TradeDirection.SHORT]] },
  })
  declare direction: TradeDirection;

  @Column({ type: DataType.DATE, allowNull: false })
  declare entry_time: Date;

  @Column({ type: DataType.DECIMAL(18, 8), allowNull: false })
  declare entry_price: number;

  @Column({ type: DataType.DATE, allowNull: true })
  declare exit_time: Date | null;

  @Column({ type: DataType.DECIMAL(18, 8), allowNull: true })
  declare exit_price: number | null;

  @Column({ type: DataType.DECIMAL(18, 8), allowNull: false })
  declare quantity: number;

  @Column({ type: DataType.DECIMAL(18, 8), allowNull: true })
  declare pnl: number | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    validate: {
      isIn: [[TradeStatus.OPEN, TradeStatus.CLOSED, TradeStatus.CANCELLED]],
    },
  })
  declare status: TradeStatus;

  /**
   * Automatically managed by PostgreSQL trigger (update_last_updated_column)
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare last_updated: Date;
}

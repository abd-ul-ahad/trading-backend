import { Table, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { User } from './user.model';
import { Strategy } from './strategy.model';
import { BrokerAccount } from './broker-account.model';

/**
 * UserStrategySubscription model representing user subscriptions to trading strategies
 *
 * Features:
 * - UUID primary key (id from BaseModel)
 * - Links users to strategies
 * - Tracks subscription status and performance
 * - Relationships to user, strategy, and broker account
 */
@Table({
  tableName: 'user_strategy_subscriptions',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class UserStrategySubscription extends BaseModel {
  /**
   * User ID who subscribed
   */
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  /**
   * Strategy ID being subscribed to
   */
  @ForeignKey(() => Strategy)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare strategyId: string;

  /**
   * Broker account ID linked to this subscription
   */
  @ForeignKey(() => BrokerAccount)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare brokerAccountId: string;

  /**
   * Subscription status
   * active - subscription is active and copying trades
   * paused - subscription paused by user
   * inactive - subscription ended
   * error - subscription has errors
   */
  @Column({
    type: DataType.ENUM('active', 'paused', 'inactive', 'error'),
    allowNull: false,
    defaultValue: 'active',
  })
  declare status: 'active' | 'paused' | 'inactive' | 'error';

  /**
   * Initial investment amount
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
  })
  declare initialInvestment: number;

  /**
   * Current account value
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
  })
  declare currentValue: number;

  /**
   * Realized profit/loss
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
    defaultValue: 0,
  })
  declare realizedPnL: number;

  /**
   * Unrealized profit/loss
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
    defaultValue: 0,
  })
  declare unrealizedPnL: number;

  /**
   * Return percentage
   * Precision: 10 total digits, 4 decimal places
   */
  @Column({
    type: DataType.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 0,
  })
  declare returnPercent: number;

  /**
   * Number of trades copied
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare tradesCopied: number;

  /**
   * Subscription start date
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare subscribedAt: Date;

  /**
   * Subscription end date (if inactive)
   */
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare unsubscribedAt: Date;

  /**
   * Error message if status is 'error'
   */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare errorMessage: string;

  // Relationships
  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => Strategy)
  declare strategy: Strategy;

  @BelongsTo(() => BrokerAccount)
  declare brokerAccount: BrokerAccount;
}

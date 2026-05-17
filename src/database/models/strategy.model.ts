import { Table, Column, DataType, HasMany } from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { UserStrategySubscription } from './user-strategy-subscription.model';

/**
 * Strategy model representing trading strategies
 *
 * Features:
 * - UUID primary key (id from BaseModel)
 * - Performance metrics tracking
 * - Strategy metadata and configuration
 * - Relationships to user subscriptions
 */
@Table({
  tableName: 'strategies',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class Strategy extends BaseModel {
  /**
   * Strategy name
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  /**
   * Strategy description
   */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string;

  /**
   * Strategy creator/manager user ID
   */
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare createdByUserId: string;

  /**
   * Current number of subscribers
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare subscriberCount: number;

  /**
   * Total return percentage
   * Precision: 10 total digits, 4 decimal places
   */
  @Column({
    type: DataType.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 0,
  })
  declare totalReturn: number;

  /**
   * Win rate as decimal (0 to 1)
   * Precision: 5 total digits, 4 decimal places
   */
  @Column({
    type: DataType.DECIMAL(5, 4),
    allowNull: false,
    defaultValue: 0,
  })
  declare winRate: number;

  /**
   * Maximum drawdown percentage
   * Precision: 10 total digits, 4 decimal places
   */
  @Column({
    type: DataType.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 0,
  })
  declare maxDrawdown: number;

  /**
   * Average trade duration in hours
   */
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare avgTradeDuration: number;

  /**
   * Strategy status
   * active - accepting new subscribers
   * inactive - not accepting new subscribers
   * archived - strategy is archived
   */
  @Column({
    type: DataType.ENUM('active', 'inactive', 'archived'),
    allowNull: false,
    defaultValue: 'active',
  })
  declare status: 'active' | 'inactive' | 'archived';

  /**
   * Minimum investment required
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
    defaultValue: 100,
  })
  declare minimumInvestment: number;

  /**
   * Management fee percentage
   * Precision: 5 total digits, 4 decimal places
   */
  @Column({
    type: DataType.DECIMAL(5, 4),
    allowNull: false,
    defaultValue: 0,
  })
  declare managementFeePercent: number;

  /**
   * Performance fee percentage
   * Precision: 5 total digits, 4 decimal places
   */
  @Column({
    type: DataType.DECIMAL(5, 4),
    allowNull: false,
    defaultValue: 0,
  })
  declare performanceFeePercent: number;

  // Relationships
  @HasMany(() => UserStrategySubscription)
  declare subscribers: UserStrategySubscription[];
}

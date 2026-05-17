import { Table, Column, DataType, HasMany } from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { BrokerAccount } from './broker-account.model';
import { UserStrategySubscription } from './user-strategy-subscription.model';

/**
 * User model representing platform users
 *
 * Features:
 * - UUID primary key (id from BaseModel)
 * - Email uniqueness constraint
 * - Password hashing (handled in service)
 * - Timestamps for audit trail
 * - Relationships to broker accounts and strategy subscriptions
 */
@Table({
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class User extends BaseModel {
  /**
   * User email address
   * Unique constraint for login
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  declare email: string;

  /**
   * User full name
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare fullName: string;

  /**
   * Hashed password
   * Never stored in plain text
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare password: string;

  /**
   * User account status
   * active - user can access platform
   * inactive - user account disabled
   * pending - email verification pending
   */
  @Column({
    type: DataType.ENUM('active', 'inactive', 'pending'),
    allowNull: false,
    defaultValue: 'pending',
  })
  declare status: 'active' | 'inactive' | 'pending';

  /**
   * Email verification token
   * Used for email confirmation
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare emailVerificationToken: string;

  /**
   * Email verified timestamp
   */
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare emailVerifiedAt: Date;

  /**
   * Last login timestamp
   */
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare lastLoginAt: Date;

  // Relationships
  @HasMany(() => BrokerAccount)
  declare brokerAccounts: BrokerAccount[];

  @HasMany(() => UserStrategySubscription)
  declare strategySubscriptions: UserStrategySubscription[];
}

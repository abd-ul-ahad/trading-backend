import { Table, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { User } from './user.model';

/**
 * BrokerAccount model representing linked broker trading accounts
 *
 * Features:
 * - UUID primary key (id from BaseModel)
 * - Encrypted credentials storage
 * - Account linking and verification
 * - Relationship to user
 */
@Table({
  tableName: 'broker_accounts',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class BrokerAccount extends BaseModel {
  /**
   * User ID who owns this broker account
   */
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  /**
   * Broker name (e.g., 'MetaAPI', 'Interactive Brokers')
   */
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare brokerName: string;

  /**
   * Broker account number/login
   */
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare accountNumber: string;

  /**
   * Broker server name
   */
  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare serverName: string;

  /**
   * Encrypted read-only credentials (JSON)
   * Stored encrypted for security
   * Format: { login, password, server }
   */
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare encryptedCredentials: string;

  /**
   * Account balance
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
    defaultValue: 0,
  })
  declare balance: number;

  /**
   * Account equity
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
    defaultValue: 0,
  })
  declare equity: number;

  /**
   * Account status
   * linked - account successfully linked
   * pending - awaiting verification
   * inactive - account disabled
   * error - connection error
   */
  @Column({
    type: DataType.ENUM('linked', 'pending', 'inactive', 'error'),
    allowNull: false,
    defaultValue: 'pending',
  })
  declare status: 'linked' | 'pending' | 'inactive' | 'error';

  /**
   * Last sync timestamp
   * When account data was last synchronized
   */
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare lastSyncAt: Date;

  /**
   * Error message if status is 'error'
   */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare errorMessage: string;

  /**
   * Account type
   * demo - demo/practice account
   * live - real money account
   */
  @Column({
    type: DataType.ENUM('demo', 'live'),
    allowNull: false,
    defaultValue: 'demo',
  })
  declare accountType: 'demo' | 'live';

  // Relationships
  @BelongsTo(() => User)
  declare user: User;
}

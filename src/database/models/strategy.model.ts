import { Table, Column, DataType } from 'sequelize-typescript';
import { BaseModel } from './base.model';

/**
 * Strategy model representing a trading strategy
 *
 * Stores strategy metadata and configuration.
 * Linked to accounts and trades for performance tracking.
 *
 * Features:
 * - UUID primary key (id from BaseModel)
 * - Strategy name and description
 * - Account association
 * - Status tracking (active/inactive)
 * - Automatic timestamp management
 *
 * Requirements: Strategy management and performance tracking
 */
@Table({
  tableName: 'strategies',
  timestamps: true,
  paranoid: false,
  underscored: true,
})
export class Strategy extends BaseModel {
  /**
   * Strategy name
   * Human-readable identifier for the strategy
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  /**
   * Strategy description
   * Detailed information about the strategy
   */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  /**
   * Account identifier
   * References the trading account this strategy operates on
   */
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare account_id: string;

  /**
   * Strategy status
   * Indicates if the strategy is active or inactive
   */
  @Column({
    type: DataType.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  })
  declare status: 'active' | 'inactive';

  /**
   * Initial capital
   * Starting capital for this strategy (used for return calculations)
   * Precision: 18 total digits, 8 decimal places
   */
  @Column({
    type: DataType.DECIMAL(18, 8),
    allowNull: false,
    defaultValue: 0,
  })
  declare initial_capital: number;
}

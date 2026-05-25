import { Table, Column, DataType } from 'sequelize-typescript';
import { BaseModel } from './base.model';

/**
 * Strategy model representing a trading strategy.
 *
 * Stores strategy identity and lifecycle status only. Performance, capital,
 * and account linkage are tracked elsewhere (strategy_performance,
 * real_time_strategies, trades).
 */
@Table({
  tableName: 'strategies',
  timestamps: true,
  paranoid: false,
  underscored: true,
})
export class Strategy extends BaseModel {
  /**
   * Human-readable strategy name.
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  /**
   * Lifecycle status. `active` strategies are eligible to receive trades.
   */
  @Column({
    type: DataType.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  })
  declare status: 'active' | 'inactive';
}

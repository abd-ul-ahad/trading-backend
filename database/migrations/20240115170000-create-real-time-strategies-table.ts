import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create real_time_strategies table
 * 
 * This migration creates the real-time strategies table for live strategy monitoring.
 * This table contains only the most recent state for each strategy (single row per strategy).
 * 
 * Requirements: 4.3, 4.6, 10.3
 * 
 * Context: This is the real-time table for live strategy monitoring. It contains only
 * the most recent state for each strategy (single row per strategy). Synchronization from
 * the historical strategy_performance table is handled by triggers (created in a separate migration).
 * 
 * Indexes:
 * - Primary key on strategy_id (automatic index for direct lookup)
 * - idx_rt_strategies_account: Query all strategies for an account
 */
export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('real_time_strategies', {
      strategy_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for the strategy'
      },
      account_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Reference to the trading account'
      },
      total_pnl: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        defaultValue: 0,
        comment: 'Total profit/loss for the strategy'
      },
      unrealized_pnl: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        defaultValue: 0,
        comment: 'Unrealized profit/loss from open positions'
      },
      current_drawdown: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0,
        comment: 'Current drawdown percentage for the strategy'
      },
      last_updated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Timestamp of last update (managed by trigger)'
      }
    });

    // Create index on account_id to support "all strategies for account" queries
    await queryInterface.addIndex('real_time_strategies', {
      fields: ['account_id'],
      name: 'idx_rt_strategies_account'
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // Drop index first
    await queryInterface.removeIndex('real_time_strategies', 'idx_rt_strategies_account');

    // Drop the table
    await queryInterface.dropTable('real_time_strategies');
  }
};

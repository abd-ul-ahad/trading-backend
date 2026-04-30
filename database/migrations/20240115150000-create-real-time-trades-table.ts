import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create real_time_trades table
 * 
 * This migration creates the real-time trades table for live dashboard queries.
 * This table contains only open trades and recently closed trades (24hr window).
 * 
 * Requirements: 4.1, 4.4, 10.3, 10.5
 * 
 * Context: This is the real-time table for live dashboard queries. It contains only
 * open trades and recently closed trades (24hr window). Synchronization from the
 * historical trades table is handled by triggers (created in a separate migration).
 * 
 * Indexes:
 * - idx_rt_trades_account_status: Query open trades by account
 * - idx_rt_trades_strategy_status: Query open trades by strategy
 * - idx_rt_trades_last_updated: Recently updated trades
 */
export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('real_time_trades', {
      trade_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for the trade (references trades.trade_id)'
      },
      strategy_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Reference to the trading strategy'
      },
      account_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Reference to the trading account'
      },
      symbol: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Trading symbol (e.g., AAPL, EURUSD)'
      },
      direction: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'Trade direction: long or short'
      },
      entry_time: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Timestamp when the trade was entered'
      },
      entry_price: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        comment: 'Price at which the trade was entered'
      },
      quantity: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        comment: 'Quantity of the asset traded'
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Trade status: open, closed, or cancelled'
      },
      last_updated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Timestamp of last update (managed by trigger)'
      }
    });

    // Add CHECK constraint for direction
    await queryInterface.sequelize.query(`
      ALTER TABLE real_time_trades
      ADD CONSTRAINT real_time_trades_direction_check
      CHECK (direction IN ('long', 'short'))
    `);

    // Add CHECK constraint for status
    await queryInterface.sequelize.query(`
      ALTER TABLE real_time_trades
      ADD CONSTRAINT real_time_trades_status_check
      CHECK (status IN ('open', 'closed', 'cancelled'))
    `);

    // Create indexes for query optimization
    // Index 1: Query open trades by account (composite index)
    await queryInterface.addIndex('real_time_trades', {
      fields: ['account_id', 'status'],
      name: 'idx_rt_trades_account_status'
    });

    // Index 2: Query open trades by strategy (composite index)
    await queryInterface.addIndex('real_time_trades', {
      fields: ['strategy_id', 'status'],
      name: 'idx_rt_trades_strategy_status'
    });

    // Index 3: Retrieve recently updated trades (DESC order)
    await queryInterface.addIndex('real_time_trades', {
      fields: [{ name: 'last_updated', order: 'DESC' }],
      name: 'idx_rt_trades_last_updated'
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // Drop indexes first
    await queryInterface.removeIndex('real_time_trades', 'idx_rt_trades_last_updated');
    await queryInterface.removeIndex('real_time_trades', 'idx_rt_trades_strategy_status');
    await queryInterface.removeIndex('real_time_trades', 'idx_rt_trades_account_status');

    // Drop the table (constraints are dropped automatically)
    await queryInterface.dropTable('real_time_trades');
  }
};

import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create trades table
 * 
 * This migration creates the historical trades table with all columns, indexes, and constraints
 * as specified in the real-time-trading-performance-db design.
 * 
 * Requirements: 1.1, 1.2, 1.3, 10.3, 10.5
 * 
 * Indexes:
 * - idx_trades_account_status: Query open trades by account
 * - idx_trades_strategy_status: Query open trades by strategy
 * - idx_trades_last_updated: Retrieve recently updated trades
 * - idx_trades_entry_time: Historical analysis by time
 * - idx_trades_symbol: Filter trades by symbol
 */
export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('trades', {
      trade_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for the trade'
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
      exit_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp when the trade was exited (null for open trades)'
      },
      exit_price: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: true,
        comment: 'Price at which the trade was exited (null for open trades)'
      },
      quantity: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        comment: 'Quantity of the asset traded'
      },
      pnl: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: true,
        comment: 'Profit and loss for the trade (null for open trades)'
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
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Timestamp when the record was created'
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Timestamp when the record was last updated'
      }
    });

    // Add CHECK constraint for direction
    await queryInterface.sequelize.query(`
      ALTER TABLE trades
      ADD CONSTRAINT trades_direction_check
      CHECK (direction IN ('long', 'short'))
    `);

    // Add CHECK constraint for status
    await queryInterface.sequelize.query(`
      ALTER TABLE trades
      ADD CONSTRAINT trades_status_check
      CHECK (status IN ('open', 'closed', 'cancelled'))
    `);

    // Create indexes for query optimization
    // Index 1: Query open trades by account (composite index)
    await queryInterface.addIndex('trades', {
      fields: ['account_id', 'status'],
      name: 'idx_trades_account_status'
    });

    // Index 2: Query open trades by strategy (composite index)
    await queryInterface.addIndex('trades', {
      fields: ['strategy_id', 'status'],
      name: 'idx_trades_strategy_status'
    });

    // Index 3: Retrieve recently updated trades (DESC order)
    await queryInterface.addIndex('trades', {
      fields: [{ name: 'last_updated', order: 'DESC' }],
      name: 'idx_trades_last_updated'
    });

    // Index 4: Historical analysis by entry time (DESC order)
    await queryInterface.addIndex('trades', {
      fields: [{ name: 'entry_time', order: 'DESC' }],
      name: 'idx_trades_entry_time'
    });

    // Index 5: Filter trades by symbol
    await queryInterface.addIndex('trades', {
      fields: ['symbol'],
      name: 'idx_trades_symbol'
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // Drop indexes first
    await queryInterface.removeIndex('trades', 'idx_trades_symbol');
    await queryInterface.removeIndex('trades', 'idx_trades_entry_time');
    await queryInterface.removeIndex('trades', 'idx_trades_last_updated');
    await queryInterface.removeIndex('trades', 'idx_trades_strategy_status');
    await queryInterface.removeIndex('trades', 'idx_trades_account_status');

    // Drop the table (constraints are dropped automatically)
    await queryInterface.dropTable('trades');
  }
};

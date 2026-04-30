import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create strategy_performance table
 * 
 * This migration creates the historical strategy performance snapshots table with all columns,
 * indexes, and constraints as specified in the real-time-trading-performance-db design.
 * 
 * Requirements: 3.1, 3.2, 3.3, 10.3
 * 
 * Indexes:
 * - idx_strategy_perf_strategy_last_updated: Latest state query
 * - idx_strategy_perf_account_strategy_timestamp: Historical analysis
 * - idx_strategy_perf_timestamp: Time-based queries across strategies
 */
export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('strategy_performance', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for the performance snapshot'
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
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Timestamp of the performance snapshot'
      },
      total_trades: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total number of trades executed by the strategy'
      },
      winning_trades: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of winning trades'
      },
      losing_trades: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of losing trades'
      },
      win_rate: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0,
        comment: 'Win rate (winning_trades / total_trades)'
      },
      total_pnl: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        defaultValue: 0,
        comment: 'Total profit and loss for the strategy'
      },
      unrealized_pnl: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        defaultValue: 0,
        comment: 'Unrealized profit and loss from open positions'
      },
      realized_pnl: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        defaultValue: 0,
        comment: 'Realized profit and loss from closed positions'
      },
      max_drawdown: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0,
        comment: 'Maximum drawdown percentage experienced by the strategy'
      },
      current_drawdown: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0,
        comment: 'Current drawdown percentage from peak equity'
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

    // Create indexes for query optimization
    // Index 1: Latest state query (composite index with DESC order on last_updated)
    await queryInterface.addIndex('strategy_performance', {
      fields: ['strategy_id', { name: 'last_updated', order: 'DESC' }],
      name: 'idx_strategy_perf_strategy_last_updated'
    });

    // Index 2: Historical analysis (composite index with DESC order on timestamp)
    await queryInterface.addIndex('strategy_performance', {
      fields: ['account_id', 'strategy_id', { name: 'timestamp', order: 'DESC' }],
      name: 'idx_strategy_perf_account_strategy_timestamp'
    });

    // Index 3: Time-based queries across strategies (DESC order)
    await queryInterface.addIndex('strategy_performance', {
      fields: [{ name: 'timestamp', order: 'DESC' }],
      name: 'idx_strategy_perf_timestamp'
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // Drop indexes first
    await queryInterface.removeIndex('strategy_performance', 'idx_strategy_perf_timestamp');
    await queryInterface.removeIndex('strategy_performance', 'idx_strategy_perf_account_strategy_timestamp');
    await queryInterface.removeIndex('strategy_performance', 'idx_strategy_perf_strategy_last_updated');

    // Drop the table
    await queryInterface.dropTable('strategy_performance');
  }
};

import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create real_time_accounts table
 * 
 * This migration creates the real-time accounts table for live account monitoring.
 * This table contains only the most recent state for each account (single row per account).
 * 
 * Requirements: 4.2, 4.5, 10.3, 10.4
 * 
 * Context: This is the real-time table for live account monitoring. It contains only
 * the most recent state for each account (single row per account). Synchronization from
 * the historical account_performance table is handled by triggers (created in a separate migration).
 * 
 * Indexes:
 * - Primary key on account_id (automatic index for direct lookup)
 */
export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('real_time_accounts', {
      account_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for the account'
      },
      balance: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        comment: 'Current account balance'
      },
      equity: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        comment: 'Current account equity (balance + unrealized PnL)'
      },
      margin_used: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        comment: 'Amount of margin currently used'
      },
      margin_available: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        comment: 'Amount of margin available for new positions'
      },
      margin_level: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        comment: 'Margin level percentage (equity / margin_used * 100)'
      },
      unrealized_pnl: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        comment: 'Unrealized profit/loss from open positions'
      },
      total_pnl: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        comment: 'Total profit/loss (realized + unrealized)'
      },
      last_updated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Timestamp of last update (managed by trigger)'
      }
    });

    // Add CHECK constraint for margin_level (>= 0 AND <= 1000)
    await queryInterface.sequelize.query(`
      ALTER TABLE real_time_accounts
      ADD CONSTRAINT real_time_accounts_margin_level_check
      CHECK (margin_level >= 0 AND margin_level <= 1000)
    `);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // Drop the table (constraints are dropped automatically)
    await queryInterface.dropTable('real_time_accounts');
  }
};

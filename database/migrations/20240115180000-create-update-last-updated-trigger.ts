import { QueryInterface } from 'sequelize';

/**
 * Migration: Create update_last_updated_column trigger function
 * 
 * This migration creates a PostgreSQL trigger function that automatically updates
 * the last_updated timestamp to CURRENT_TIMESTAMP on UPDATE operations. The trigger
 * is attached to the trades, account_performance, and strategy_performance tables.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 * 
 * Context: This trigger eliminates the need for application-level timestamp management.
 * It ensures consistency across all updates and enables efficient "latest state" queries
 * using ORDER BY last_updated DESC LIMIT 1.
 * 
 * Attached to:
 * - trades (BEFORE UPDATE)
 * - account_performance (BEFORE UPDATE)
 * - strategy_performance (BEFORE UPDATE)
 */
export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    // Create the trigger function
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_last_updated_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.last_updated = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Attach trigger to trades table (BEFORE UPDATE)
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_trades_last_updated
      BEFORE UPDATE ON trades
      FOR EACH ROW
      EXECUTE FUNCTION update_last_updated_column();
    `);

    // Attach trigger to account_performance table (BEFORE UPDATE)
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_account_performance_last_updated
      BEFORE UPDATE ON account_performance
      FOR EACH ROW
      EXECUTE FUNCTION update_last_updated_column();
    `);

    // Attach trigger to strategy_performance table (BEFORE UPDATE)
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_strategy_performance_last_updated
      BEFORE UPDATE ON strategy_performance
      FOR EACH ROW
      EXECUTE FUNCTION update_last_updated_column();
    `);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // Drop triggers first (in reverse order)
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_strategy_performance_last_updated ON strategy_performance;
    `);

    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_account_performance_last_updated ON account_performance;
    `);

    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_trades_last_updated ON trades;
    `);

    // Drop the trigger function
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS update_last_updated_column();
    `);
  }
};

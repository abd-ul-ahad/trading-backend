import { QueryInterface } from 'sequelize';

/**
 * Migration: Create sync_real_time_accounts trigger function
 * 
 * This migration creates a PostgreSQL trigger function that automatically synchronizes
 * the account_performance table to the real_time_accounts table on INSERT and UPDATE operations.
 * The trigger uses ON CONFLICT (account_id) DO UPDATE for upsert behavior, maintaining only
 * the latest state for each account (single row per account).
 * 
 * Requirements: 6.2, 6.6, 8.5
 * 
 * Context: This trigger automatically synchronizes the account_performance table to the
 * real_time_accounts table, maintaining only the latest state for each account. This
 * eliminates manual sync logic and ensures live dashboards always display current data
 * without accumulating historical snapshots.
 * 
 * Behavior:
 * - On INSERT/UPDATE to account_performance: Upserts corresponding record to real_time_accounts
 * - Uses ON CONFLICT (account_id) DO UPDATE to replace previous state
 * - Maintains single row per account in real_time_accounts
 * - No cleanup needed since old states are replaced, not accumulated
 * 
 * Attached to:
 * - account_performance (AFTER INSERT OR UPDATE)
 */
export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    // Create the trigger function
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION sync_real_time_accounts()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Upsert latest account state
        INSERT INTO real_time_accounts (
          account_id, balance, equity, margin_used, margin_available,
          margin_level, unrealized_pnl, total_pnl, last_updated
        ) VALUES (
          NEW.account_id, NEW.balance, NEW.equity, NEW.margin_used, NEW.margin_available,
          NEW.margin_level, NEW.unrealized_pnl, NEW.total_pnl, NEW.last_updated
        )
        ON CONFLICT (account_id) DO UPDATE SET
          balance = EXCLUDED.balance,
          equity = EXCLUDED.equity,
          margin_used = EXCLUDED.margin_used,
          margin_available = EXCLUDED.margin_available,
          margin_level = EXCLUDED.margin_level,
          unrealized_pnl = EXCLUDED.unrealized_pnl,
          total_pnl = EXCLUDED.total_pnl,
          last_updated = EXCLUDED.last_updated;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Attach trigger to account_performance table (AFTER INSERT OR UPDATE)
    await queryInterface.sequelize.query(`
      CREATE TRIGGER sync_account_performance_to_real_time
      AFTER INSERT OR UPDATE ON account_performance
      FOR EACH ROW
      EXECUTE FUNCTION sync_real_time_accounts();
    `);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // Drop trigger first
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS sync_account_performance_to_real_time ON account_performance;
    `);

    // Drop the trigger function
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS sync_real_time_accounts();
    `);
  }
};

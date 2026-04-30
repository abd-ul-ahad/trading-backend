import { QueryInterface } from 'sequelize';

/**
 * Migration: Create sync_real_time_strategies trigger function
 * 
 * This migration creates a PostgreSQL trigger function that automatically synchronizes
 * the strategy_performance table to the real_time_strategies table on INSERT and UPDATE operations.
 * The trigger uses ON CONFLICT (strategy_id) DO UPDATE for upsert behavior, maintaining only
 * the latest state for each strategy (single row per strategy).
 * 
 * Requirements: 6.3, 6.7, 8.6
 * 
 * Context: This trigger automatically synchronizes the strategy_performance table to the
 * real_time_strategies table, maintaining only the latest state for each strategy. This
 * eliminates manual sync logic and ensures live dashboards always display current data
 * without accumulating historical snapshots.
 * 
 * Behavior:
 * - On INSERT/UPDATE to strategy_performance: Upserts corresponding record to real_time_strategies
 * - Uses ON CONFLICT (strategy_id) DO UPDATE to replace previous state
 * - Maintains single row per strategy in real_time_strategies
 * - No cleanup needed since old states are replaced, not accumulated
 * 
 * Attached to:
 * - strategy_performance (AFTER INSERT OR UPDATE)
 */
export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    // Create the trigger function
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION sync_real_time_strategies()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Upsert latest strategy state
        INSERT INTO real_time_strategies (
          strategy_id, account_id, total_pnl, unrealized_pnl,
          current_drawdown, last_updated
        ) VALUES (
          NEW.strategy_id, NEW.account_id, NEW.total_pnl, NEW.unrealized_pnl,
          NEW.current_drawdown, NEW.last_updated
        )
        ON CONFLICT (strategy_id) DO UPDATE SET
          account_id = EXCLUDED.account_id,
          total_pnl = EXCLUDED.total_pnl,
          unrealized_pnl = EXCLUDED.unrealized_pnl,
          current_drawdown = EXCLUDED.current_drawdown,
          last_updated = EXCLUDED.last_updated;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Attach trigger to strategy_performance table (AFTER INSERT OR UPDATE)
    await queryInterface.sequelize.query(`
      CREATE TRIGGER sync_strategy_performance_to_real_time
      AFTER INSERT OR UPDATE ON strategy_performance
      FOR EACH ROW
      EXECUTE FUNCTION sync_real_time_strategies();
    `);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // Drop trigger first
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS sync_strategy_performance_to_real_time ON strategy_performance;
    `);

    // Drop the trigger function
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS sync_real_time_strategies();
    `);
  }
};

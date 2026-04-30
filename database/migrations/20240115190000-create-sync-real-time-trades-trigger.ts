import { QueryInterface } from 'sequelize';

/**
 * Migration: Create sync_real_time_trades trigger function
 * 
 * This migration creates a PostgreSQL trigger function that automatically synchronizes
 * the trades table to the real_time_trades table on INSERT and UPDATE operations.
 * The trigger uses ON CONFLICT (trade_id) DO UPDATE for upsert behavior and includes
 * cleanup logic to DELETE closed trades older than 24 hours.
 * 
 * Requirements: 6.1, 6.4, 6.5, 8.4, 8.7
 * 
 * Context: This trigger automatically synchronizes the trades table to the real_time_trades
 * table, maintaining only open trades and recently closed trades (24hr window). This
 * eliminates manual sync logic and ensures live dashboards always display current data.
 * 
 * Behavior:
 * - On INSERT/UPDATE to trades: Upserts corresponding record to real_time_trades
 * - Uses ON CONFLICT (trade_id) DO UPDATE for upsert pattern
 * - Automatically removes closed/cancelled trades older than 24 hours
 * - Maintains minimal dataset in real_time_trades for fast queries
 * 
 * Attached to:
 * - trades (AFTER INSERT OR UPDATE)
 */
export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    // Create the trigger function
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION sync_real_time_trades()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Insert or update real-time trade
        INSERT INTO real_time_trades (
          trade_id, strategy_id, account_id, symbol, direction,
          entry_time, entry_price, quantity, status, last_updated
        ) VALUES (
          NEW.trade_id, NEW.strategy_id, NEW.account_id, NEW.symbol, NEW.direction,
          NEW.entry_time, NEW.entry_price, NEW.quantity, NEW.status, NEW.last_updated
        )
        ON CONFLICT (trade_id) DO UPDATE SET
          status = EXCLUDED.status,
          last_updated = EXCLUDED.last_updated;
        
        -- Remove closed trades older than 24 hours
        DELETE FROM real_time_trades
        WHERE status IN ('closed', 'cancelled')
          AND last_updated < CURRENT_TIMESTAMP - INTERVAL '24 hours';
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Attach trigger to trades table (AFTER INSERT OR UPDATE)
    await queryInterface.sequelize.query(`
      CREATE TRIGGER sync_trades_to_real_time
      AFTER INSERT OR UPDATE ON trades
      FOR EACH ROW
      EXECUTE FUNCTION sync_real_time_trades();
    `);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // Drop trigger first
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS sync_trades_to_real_time ON trades;
    `);

    // Drop the trigger function
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS sync_real_time_trades();
    `);
  }
};

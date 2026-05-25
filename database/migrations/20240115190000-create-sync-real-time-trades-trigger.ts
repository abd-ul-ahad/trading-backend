import { QueryInterface, Transaction } from 'sequelize';

/**
 * Migration: Create sync_real_time_trades trigger (atomic via transaction).
 *
 * Mirrors trades -> real_time_trades on INSERT/UPDATE via upsert, and prunes
 * closed/cancelled trades older than 24 hours.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.sequelize.query(
      `CREATE OR REPLACE FUNCTION sync_real_time_trades()
       RETURNS TRIGGER AS $$
       BEGIN
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

         DELETE FROM real_time_trades
         WHERE status IN ('closed', 'cancelled')
           AND last_updated < CURRENT_TIMESTAMP - INTERVAL '24 hours';

         RETURN NEW;
       END;
       $$ LANGUAGE plpgsql;`,
      { transaction: t },
    );

    await queryInterface.sequelize.query(
      `CREATE TRIGGER sync_trades_to_real_time
       AFTER INSERT OR UPDATE ON trades
       FOR EACH ROW
       EXECUTE FUNCTION sync_real_time_trades();`,
      { transaction: t },
    );
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS sync_trades_to_real_time ON trades;`,
      { transaction: t },
    );
    await queryInterface.sequelize.query(
      `DROP FUNCTION IF EXISTS sync_real_time_trades();`,
      { transaction: t },
    );
  });
}

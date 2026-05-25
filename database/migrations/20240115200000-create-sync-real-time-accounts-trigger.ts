import { QueryInterface, Transaction } from 'sequelize';

/**
 * Migration: Create sync_real_time_accounts trigger (atomic via transaction).
 *
 * Mirrors account_performance -> real_time_accounts on INSERT/UPDATE via upsert.
 * real_time_accounts keeps a single row per account (latest state).
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.sequelize.query(
      `CREATE OR REPLACE FUNCTION sync_real_time_accounts()
       RETURNS TRIGGER AS $$
       BEGIN
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
       $$ LANGUAGE plpgsql;`,
      { transaction: t },
    );

    await queryInterface.sequelize.query(
      `CREATE TRIGGER sync_account_performance_to_real_time
       AFTER INSERT OR UPDATE ON account_performance
       FOR EACH ROW
       EXECUTE FUNCTION sync_real_time_accounts();`,
      { transaction: t },
    );
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS sync_account_performance_to_real_time ON account_performance;`,
      { transaction: t },
    );
    await queryInterface.sequelize.query(
      `DROP FUNCTION IF EXISTS sync_real_time_accounts();`,
      { transaction: t },
    );
  });
}

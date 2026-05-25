import { QueryInterface, Transaction } from 'sequelize';

/**
 * Migration: Create sync_real_time_strategies trigger (atomic via transaction).
 *
 * Mirrors strategy_performance -> real_time_strategies on INSERT/UPDATE via upsert.
 * real_time_strategies keeps a single row per strategy (latest state).
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.sequelize.query(
      `CREATE OR REPLACE FUNCTION sync_real_time_strategies()
       RETURNS TRIGGER AS $$
       BEGIN
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
       $$ LANGUAGE plpgsql;`,
      { transaction: t },
    );

    await queryInterface.sequelize.query(
      `CREATE TRIGGER sync_strategy_performance_to_real_time
       AFTER INSERT OR UPDATE ON strategy_performance
       FOR EACH ROW
       EXECUTE FUNCTION sync_real_time_strategies();`,
      { transaction: t },
    );
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS sync_strategy_performance_to_real_time ON strategy_performance;`,
      { transaction: t },
    );
    await queryInterface.sequelize.query(
      `DROP FUNCTION IF EXISTS sync_real_time_strategies();`,
      { transaction: t },
    );
  });
}

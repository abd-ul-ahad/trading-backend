import { QueryInterface, Transaction } from 'sequelize';

/**
 * Migration: Create update_last_updated_column trigger (atomic via transaction).
 *
 * Creates a plpgsql function that sets NEW.last_updated = CURRENT_TIMESTAMP on
 * UPDATE, and attaches it to: trades, account_performance, strategy_performance.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.sequelize.query(
      `CREATE OR REPLACE FUNCTION update_last_updated_column()
       RETURNS TRIGGER AS $$
       BEGIN
         NEW.last_updated = CURRENT_TIMESTAMP;
         RETURN NEW;
       END;
       $$ LANGUAGE plpgsql;`,
      { transaction: t },
    );

    await queryInterface.sequelize.query(
      `CREATE TRIGGER update_trades_last_updated
       BEFORE UPDATE ON trades
       FOR EACH ROW
       EXECUTE FUNCTION update_last_updated_column();`,
      { transaction: t },
    );

    await queryInterface.sequelize.query(
      `CREATE TRIGGER update_account_performance_last_updated
       BEFORE UPDATE ON account_performance
       FOR EACH ROW
       EXECUTE FUNCTION update_last_updated_column();`,
      { transaction: t },
    );

    await queryInterface.sequelize.query(
      `CREATE TRIGGER update_strategy_performance_last_updated
       BEFORE UPDATE ON strategy_performance
       FOR EACH ROW
       EXECUTE FUNCTION update_last_updated_column();`,
      { transaction: t },
    );
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS update_strategy_performance_last_updated ON strategy_performance;`,
      { transaction: t },
    );
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS update_account_performance_last_updated ON account_performance;`,
      { transaction: t },
    );
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS update_trades_last_updated ON trades;`,
      { transaction: t },
    );
    await queryInterface.sequelize.query(
      `DROP FUNCTION IF EXISTS update_last_updated_column();`,
      { transaction: t },
    );
  });
}

import { QueryInterface, DataTypes, Transaction } from 'sequelize';

/**
 * Migration: Drop description, account_id, initial_capital columns from `strategies`.
 *
 * Why: these fields are no longer part of the Strategy domain. A strategy is
 * now uniquely defined by name + status. The `strategies_account_id` index is
 * dropped automatically by Postgres when the column is removed.
 *
 * Atomic: wrapped in a single transaction (Postgres supports transactional DDL).
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    // Drop the explicit index first for clarity (Postgres would also auto-drop
    // it with the column, but being explicit avoids surprises if column drop
    // semantics ever change).
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "strategies_account_id"`,
      { transaction: t },
    );

    await queryInterface.removeColumn('strategies', 'description', {
      transaction: t,
    });
    await queryInterface.removeColumn('strategies', 'account_id', {
      transaction: t,
    });
    await queryInterface.removeColumn('strategies', 'initial_capital', {
      transaction: t,
    });
  });
}

/**
 * Rollback: re-add the columns. `account_id` is restored as NULLABLE so the
 * rollback succeeds even if the table contains rows. Operators can tighten
 * the constraint with a follow-up migration after backfilling data.
 */
export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.addColumn(
      'strategies',
      'description',
      {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      { transaction: t },
    );

    await queryInterface.addColumn(
      'strategies',
      'account_id',
      {
        type: DataTypes.UUID,
        allowNull: true,
      },
      { transaction: t },
    );

    await queryInterface.addColumn(
      'strategies',
      'initial_capital',
      {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        defaultValue: 0,
      },
      { transaction: t },
    );

    await queryInterface.addIndex('strategies', {
      fields: ['account_id'],
      name: 'strategies_account_id',
      transaction: t,
    });
  });
}

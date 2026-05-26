import { QueryInterface, DataTypes, Transaction } from 'sequelize';

/**
 * Migration: harden the daily strategy-sync pipeline.
 *
 * Adds two backstops that the application layer cannot guarantee on its
 * own once the service runs on more than one replica:
 *
 * 1. `strategy_performance.snapshot_day` — a `DATE` generated column that
 *    truncates `timestamp` to its UTC day, plus a `UNIQUE (strategy_id,
 *    snapshot_day)` constraint. This lets the sync use Postgres
 *    `ON CONFLICT (strategy_id, snapshot_day) DO UPDATE` to make
 *    "one snapshot per strategy per day" a hard DB invariant. Replaces
 *    the racy `findOne -> create` pattern in the application code.
 *
 * 2. `sync_cursors` — a per-account high-water-mark of the latest deal
 *    we have successfully synced from MetaApi. Lets the sync pull only
 *    new deals on subsequent runs (with a 1h overlap to absorb clock
 *    skew between MetaApi and our server), instead of refetching a
 *    fixed 30-day rolling window that silently loses data for any
 *    position held longer than the window.
 *
 * Atomic: wrapped in a transaction; Postgres supports transactional DDL
 * so a partial failure rolls back cleanly.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    // 1a. Add the generated `snapshot_day` column. `STORED` means Postgres
    // materialises the value on write — required for use in a UNIQUE
    // constraint (UNIQUE indexes are not allowed on VIRTUAL columns).
    await queryInterface.sequelize.query(
      `ALTER TABLE strategy_performance
       ADD COLUMN snapshot_day DATE GENERATED ALWAYS AS
         (("timestamp" AT TIME ZONE 'UTC')::date) STORED`,
      { transaction: t },
    );

    // 1b. Enforce one snapshot per strategy per UTC day.
    await queryInterface.sequelize.query(
      `ALTER TABLE strategy_performance
       ADD CONSTRAINT strategy_performance_strategy_day_unique
       UNIQUE (strategy_id, snapshot_day)`,
      { transaction: t },
    );

    // 2. Sync cursors — one row per MetaApi account.
    await queryInterface.createTable(
      'sync_cursors',
      {
        account_id: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          comment: 'MetaApi account this cursor tracks.',
        },
        last_deal_synced_at: {
          type: DataTypes.DATE,
          allowNull: false,
          comment:
            'Latest deal.time we have successfully ingested. Next run ' +
            'queries deals strictly after (this - overlap_window).',
        },
        last_run_at: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: 'Wall-clock time of the most recent sync run.',
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      { transaction: t },
    );
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (t: Transaction) => {
    await queryInterface.dropTable('sync_cursors', { transaction: t });

    await queryInterface.sequelize.query(
      `ALTER TABLE strategy_performance
       DROP CONSTRAINT IF EXISTS strategy_performance_strategy_day_unique`,
      { transaction: t },
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE strategy_performance DROP COLUMN IF EXISTS snapshot_day`,
      { transaction: t },
    );
  });
}

/**
 * Repair tool: re-syncs SequelizeMeta against the live database.
 *
 * Why this exists: if a migration failed mid-way before transactions were
 * introduced (or the SequelizeMeta table was wiped), the DB can hold objects
 * that aren't recorded as "applied". Sequelize then keeps trying to re-create
 * them and fails on duplicate-relation errors.
 *
 * What it does (data-safe):
 *   1. Connects using the same env vars the app uses (DB_HOST, DB_USERNAME, ...).
 *   2. Ensures SequelizeMeta exists.
 *   3. For each known migration, checks the DB for the object it creates
 *      (table name, function name, etc.).
 *   4. If the object exists and the migration is NOT already recorded as
 *      applied, inserts the migration name into SequelizeMeta.
 *   5. Prints a per-migration report.
 *
 * After repair, `npm run db:migrate` will only run truly pending migrations.
 *
 * Usage:
 *   npm run db:migrate:repair
 */

import 'dotenv/config';
import { Sequelize, QueryTypes } from 'sequelize';

interface MigrationFingerprint {
  name: string;
  description: string;
  check: (sequelize: Sequelize) => Promise<boolean>;
}

interface ExistsRow {
  exists: boolean;
}

const tableExists =
  (table: string) =>
  async (sequelize: Sequelize): Promise<boolean> => {
    const rows = await sequelize.query<ExistsRow>(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_name = $1
       ) AS exists`,
      { bind: [table], type: QueryTypes.SELECT },
    );
    return rows[0]?.exists === true;
  };

const functionExists =
  (fn: string) =>
  async (sequelize: Sequelize): Promise<boolean> => {
    const rows = await sequelize.query<ExistsRow>(
      `SELECT EXISTS (
         SELECT 1
         FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public'
           AND p.proname = $1
       ) AS exists`,
      { bind: [fn], type: QueryTypes.SELECT },
    );
    return rows[0]?.exists === true;
  };

/**
 * Detects a "column has been dropped" migration. Returns true only when the
 * table exists AND the named column does NOT exist (i.e. the drop completed).
 */
const columnAbsent =
  (table: string, column: string) =>
  async (sequelize: Sequelize): Promise<boolean> => {
    const rows = await sequelize.query<ExistsRow>(
      `SELECT
         EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = $1
         )
         AND NOT EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
         ) AS exists`,
      { bind: [table, column], type: QueryTypes.SELECT },
    );
    return rows[0]?.exists === true;
  };

// Ordered list of every known migration and how to detect it in the DB.
const MIGRATIONS: MigrationFingerprint[] = [
  {
    name: '20240115110000-create-strategies-table',
    description: "table 'strategies'",
    check: tableExists('strategies'),
  },
  {
    name: '20240115120000-create-trades-table',
    description: "table 'trades'",
    check: tableExists('trades'),
  },
  {
    name: '20240115130000-create-account-performance-table',
    description: "table 'account_performance'",
    check: tableExists('account_performance'),
  },
  {
    name: '20240115140000-create-strategy-performance-table',
    description: "table 'strategy_performance'",
    check: tableExists('strategy_performance'),
  },
  {
    name: '20240115150000-create-real-time-trades-table',
    description: "table 'real_time_trades'",
    check: tableExists('real_time_trades'),
  },
  {
    name: '20240115160000-create-real-time-accounts-table',
    description: "table 'real_time_accounts'",
    check: tableExists('real_time_accounts'),
  },
  {
    name: '20240115170000-create-real-time-strategies-table',
    description: "table 'real_time_strategies'",
    check: tableExists('real_time_strategies'),
  },
  {
    name: '20240115180000-create-update-last-updated-trigger',
    description: "function 'update_last_updated_column'",
    check: functionExists('update_last_updated_column'),
  },
  {
    name: '20240115190000-create-sync-real-time-trades-trigger',
    description: "function 'sync_real_time_trades'",
    check: functionExists('sync_real_time_trades'),
  },
  {
    name: '20240115200000-create-sync-real-time-accounts-trigger',
    description: "function 'sync_real_time_accounts'",
    check: functionExists('sync_real_time_accounts'),
  },
  {
    name: '20240115210000-create-sync-real-time-strategies-trigger',
    description: "function 'sync_real_time_strategies'",
    check: functionExists('sync_real_time_strategies'),
  },
  {
    name: '20260524210000-drop-strategies-extra-columns',
    description:
      "strategies columns 'description'/'account_id'/'initial_capital' dropped",
    // We detect the drop by checking a representative column. If ANY of the
    // three are absent we assume the drop migration ran.
    check: columnAbsent('strategies', 'initial_capital'),
  },
];

function buildSequelize(): Sequelize {
  const database = process.env.DB_DATABASE;
  const username = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;

  if (!database || !username) {
    throw new Error(
      'Missing DB_DATABASE or DB_USERNAME in environment. Check your .env file.',
    );
  }

  return new Sequelize(database, username, password ?? '', {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false,
  });
}

async function ensureSequelizeMetaTable(sequelize: Sequelize): Promise<void> {
  await sequelize.query(
    `CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
       "name" VARCHAR(255) NOT NULL PRIMARY KEY
     )`,
  );
}

async function readAppliedMigrations(sequelize: Sequelize): Promise<Set<string>> {
  const rows = await sequelize.query<{ name: string }>(
    `SELECT "name" FROM "SequelizeMeta" ORDER BY "name" ASC`,
    { type: QueryTypes.SELECT },
  );
  return new Set(rows.map((r) => r.name));
}

async function recordMigration(sequelize: Sequelize, name: string): Promise<void> {
  await sequelize.query(
    `INSERT INTO "SequelizeMeta" ("name") VALUES ($1) ON CONFLICT DO NOTHING`,
    { bind: [name], type: QueryTypes.INSERT },
  );
}

async function main(): Promise<void> {
  const sequelize = buildSequelize();

  try {
    await sequelize.authenticate();
    console.log(
      `\nConnected to postgres://${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_DATABASE}\n`,
    );

    await ensureSequelizeMetaTable(sequelize);
    const applied = await readAppliedMigrations(sequelize);

    console.log(`SequelizeMeta currently tracks ${applied.size} migration(s).\n`);
    console.log('Scanning migrations:');

    let repaired = 0;
    let alreadyTracked = 0;
    let stillPending = 0;

    for (const migration of MIGRATIONS) {
      const isTracked = applied.has(migration.name);
      const objectExists = await migration.check(sequelize);

      if (isTracked) {
        console.log(`  [=] ${migration.name}  (already tracked)`);
        alreadyTracked++;
        continue;
      }

      if (objectExists) {
        await recordMigration(sequelize, migration.name);
        console.log(
          `  [+] ${migration.name}  (repaired - ${migration.description} found in DB)`,
        );
        repaired++;
        continue;
      }

      console.log(
        `  [ ] ${migration.name}  (pending - ${migration.description} not found)`,
      );
      stillPending++;
    }

    console.log('\nSummary:');
    console.log(`  Already tracked: ${alreadyTracked}`);
    console.log(`  Newly repaired:  ${repaired}`);
    console.log(`  Still pending:   ${stillPending}`);
    console.log('\nNext step: npm run db:migrate\n');
  } finally {
    await sequelize.close();
  }
}

main().catch((err) => {
  console.error('\nRepair failed:', err);
  process.exit(1);
});

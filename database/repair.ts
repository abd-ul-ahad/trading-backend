/**
 * Repair tool: re-syncs SequelizeMeta against the live database.
 *
 * Why this exists
 * ---------------
 * Two failure modes can leave SequelizeMeta out of sync with the real schema:
 *
 *   1. A migration crashed mid-way before transactions were introduced, so DB
 *      objects exist but the migration is not marked as applied.
 *   2. A previous version of this repair script inserted rows WITHOUT the
 *      ".ts" file extension. sequelize-cli (via umzug) stores migrations as
 *      `path.basename(diskFile)` (e.g. "20240115110000-create-strategies-
 *      table.ts") and compares pending migrations by that exact string. A bare
 *      name in SequelizeMeta therefore does NOT match the on-disk filename, so
 *      `db:migrate` re-runs the migration and crashes on duplicate objects
 *      (e.g. `relation "strategies_account_id" already exists`).
 *
 * What this script does (data-safe)
 * ---------------------------------
 *   1. Connects with the app's DB env vars.
 *   2. Ensures SequelizeMeta exists.
 *   3. For each known migration:
 *        - Resolves its real on-disk filename (e.g. ".ts" or ".js").
 *        - Treats it as "tracked" if EITHER the bare name OR the full filename
 *          is present in SequelizeMeta.
 *        - If only the bare name is present, upgrades it: inserts the full
 *          filename and removes the bare-name row.
 *        - If neither is present but the migration's DB object exists, inserts
 *          the full filename (this heals point 1 above).
 *   4. Reports unknown rows (entries in SequelizeMeta that don't match any
 *      known migration). These are NEVER deleted - operators must inspect
 *      them manually.
 *
 * After repair, `npm run db:migrate` will only run truly pending migrations.
 *
 * Usage
 *   npm run db:migrate:repair
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { Sequelize, QueryTypes } from 'sequelize';

interface MigrationFingerprint {
  /** Bare migration name (no extension). Must match an on-disk file basename. */
  name: string;
  /** Human-readable description of the DB object the migration creates. */
  description: string;
  /** Predicate that returns true if the migration's effect is visible in the DB. */
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
// `name` MUST match the migration filename minus its extension.
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

/**
 * Scans `database/migrations` and returns a map of bare migration name
 * (filename minus extension) -> actual filename including extension.
 *
 * This is the SAME basename sequelize-cli/umzug uses as the SequelizeMeta key
 * (see node_modules/umzug/lib/migration.js -> `this.file = path.basename(...)`).
 */
function discoverMigrationFiles(): Map<string, string> {
  const migrationsDir = path.resolve(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir);
  const validPattern = /^\d+[\w-]+\.(js|ts|cjs|cts)$/;

  const map = new Map<string, string>();
  for (const file of files) {
    if (file.endsWith('.d.ts')) continue;
    if (!validPattern.test(file)) continue;
    const bare = file.replace(/\.(js|ts|cjs|cts)$/, '');
    map.set(bare, file);
  }
  return map;
}

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

async function deleteMetaRow(sequelize: Sequelize, name: string): Promise<void> {
  await sequelize.query(`DELETE FROM "SequelizeMeta" WHERE "name" = $1`, {
    bind: [name],
    type: QueryTypes.DELETE,
  });
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
    const filesOnDisk = discoverMigrationFiles();

    console.log(`SequelizeMeta currently tracks ${applied.size} migration(s).`);
    console.log(`Found ${filesOnDisk.size} migration file(s) on disk.\n`);
    console.log('Scanning migrations:');

    let okTracked = 0;
    let repaired = 0;
    let upgraded = 0;
    let stillPending = 0;
    const knownNames = new Set<string>();

    for (const migration of MIGRATIONS) {
      const diskFile = filesOnDisk.get(migration.name);
      if (!diskFile) {
        console.log(
          `  [!] ${migration.name}  (file missing on disk - skipping)`,
        );
        continue;
      }

      knownNames.add(migration.name);
      knownNames.add(diskFile);

      const hasBare = applied.has(migration.name);
      const hasFull = applied.has(diskFile);

      // Case 1: Correct row already present.
      if (hasFull) {
        if (hasBare) {
          // Legacy bare-name duplicate left over from a previous broken repair.
          // Safe to remove because the canonical (with-extension) row is in place.
          await deleteMetaRow(sequelize, migration.name);
          applied.delete(migration.name);
          console.log(
            `  [~] ${diskFile}  (already tracked; removed legacy bare-name duplicate)`,
          );
          upgraded++;
        } else {
          console.log(`  [=] ${diskFile}  (already tracked)`);
        }
        okTracked++;
        continue;
      }

      // Case 2: Only the bare-name row exists. Upgrade it to the full filename
      // so sequelize-cli stops treating the migration as pending.
      if (hasBare) {
        await recordMigration(sequelize, diskFile);
        await deleteMetaRow(sequelize, migration.name);
        applied.add(diskFile);
        applied.delete(migration.name);
        console.log(
          `  [^] ${diskFile}  (upgraded - bare-name row replaced with full filename)`,
        );
        upgraded++;
        okTracked++;
        continue;
      }

      // Case 3: Nothing recorded. If the DB object exists, the migration ran
      // outside of sequelize-cli's tracking - record it now.
      const objectExists = await migration.check(sequelize);
      if (objectExists) {
        await recordMigration(sequelize, diskFile);
        applied.add(diskFile);
        console.log(
          `  [+] ${diskFile}  (repaired - ${migration.description} found in DB)`,
        );
        repaired++;
        okTracked++;
        continue;
      }

      console.log(
        `  [ ] ${diskFile}  (pending - ${migration.description} not found)`,
      );
      stillPending++;
    }

    // Surface (but do NOT delete) any rows in SequelizeMeta that don't map to
    // a known migration. Operators must decide what to do with them.
    const unknown: string[] = [];
    for (const name of applied) {
      if (!knownNames.has(name)) {
        // Some unknown entries may still correspond to on-disk files we haven't
        // listed in MIGRATIONS - tolerate those silently.
        const bare = name.replace(/\.(js|ts|cjs|cts)$/, '');
        if (filesOnDisk.has(bare)) continue;
        unknown.push(name);
      }
    }

    console.log('\nSummary:');
    console.log(`  Tracked (after repair): ${okTracked}`);
    console.log(`  Newly repaired:         ${repaired}`);
    console.log(`  Upgraded bare->full:    ${upgraded}`);
    console.log(`  Still pending:          ${stillPending}`);
    console.log(`  Unknown rows kept:      ${unknown.length}`);

    if (unknown.length > 0) {
      console.log('\nUnknown rows in SequelizeMeta (left untouched):');
      for (const name of unknown) {
        console.log(`  - ${name}`);
      }
      console.log(
        '\nIf these are obsolete, remove them manually with:\n  DELETE FROM "SequelizeMeta" WHERE "name" = \'<name>\';',
      );
    }

    console.log('\nNext step: npm run db:migrate\n');
  } finally {
    await sequelize.close();
  }
}

main().catch((err) => {
  console.error('\nRepair failed:', err);
  process.exit(1);
});

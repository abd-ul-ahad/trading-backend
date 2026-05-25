import { Injectable } from '@nestjs/common';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

/**
 * Single source of truth for database configuration.
 *
 * Consumers:
 *   - NestJS `DatabaseModule` -> `loadDatabaseConfig()` (or the legacy
 *     `DatabaseConfigService` class).
 *   - Sequelize CLI -> `src/config/database.js` re-exports `getCliConfig()`.
 *
 * The CLI requires a `{ development, test, production }` shape. Nest only
 * needs the per-env shape. Both are derived from the same pure builders so
 * they cannot drift.
 */

export type DbEnv = 'development' | 'test' | 'production';

export type DatabaseConfig = SequelizeModuleOptions & {
  // sequelize-cli reads these top-level keys; NestJS ignores extras.
  username?: string;
};

/**
 * Resolve the current environment, defaulting to development.
 */
export function resolveDbEnv(env?: string): DbEnv {
  switch (env) {
    case 'production':
    case 'test':
    case 'development':
      return env;
    default:
      return 'development';
  }
}

/**
 * Build the database config for a given environment, reading from process.env.
 *
 * - development: PostgreSQL with console logging.
 * - test:        PostgreSQL against DB_DATABASE_TEST, logging disabled.
 * - production:  PostgreSQL with required-env validation and a connection pool.
 */
export function loadDatabaseConfig(env?: DbEnv): DatabaseConfig {
  const resolved = resolveDbEnv(env ?? process.env.NODE_ENV);

  switch (resolved) {
    case 'production':
      return buildProductionConfig();
    case 'test':
      return buildTestConfig();
    case 'development':
    default:
      return buildDevelopmentConfig();
  }
}

/**
 * Sequelize CLI shape: one object per environment.
 */
export function getCliConfig(): Record<DbEnv, DatabaseConfig> {
  return {
    development: buildDevelopmentConfig(),
    test: buildTestConfig(),
    production: buildProductionConfig(),
  };
}

function buildDevelopmentConfig(): DatabaseConfig {
  return {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'nestjs_db',
    logging: console.log,
    autoLoadModels: true,
    synchronize: false,
  };
}

function buildTestConfig(): DatabaseConfig {
  return {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE_TEST || 'nestjs_db_test',
    logging: false,
    autoLoadModels: true,
    synchronize: false,
  };
}

function buildProductionConfig(): DatabaseConfig {
  validateProductionEnvVars();

  const poolMax = parseInt(process.env.DB_POOL_MAX || '5', 10);
  const poolMin = parseInt(process.env.DB_POOL_MIN || '0', 10);

  return {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    logging: false,
    autoLoadModels: true,
    synchronize: false,
    pool: {
      max: poolMax,
      min: poolMin,
      acquire: 30000,
      idle: 10000,
      evict: 10000,
    },
  };
}

function validateProductionEnvVars(): void {
  const requiredVars = ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
  const missing = requiredVars.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  if (process.env.DB_PORT) {
    const port = parseInt(process.env.DB_PORT, 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
      throw new Error(`Invalid DB_PORT: ${process.env.DB_PORT}`);
    }
  }
}

/**
 * Legacy NestJS-friendly wrapper. Prefer `loadDatabaseConfig()` in new code.
 * Kept so existing consumers (DatabaseModule, tests) keep working unchanged.
 */
@Injectable()
export class DatabaseConfigService {
  getConfig(): SequelizeModuleOptions {
    return loadDatabaseConfig();
  }

  getDevelopmentConfig(): SequelizeModuleOptions {
    return loadDatabaseConfig('development');
  }

  getTestConfig(): SequelizeModuleOptions {
    return loadDatabaseConfig('test');
  }

  getProductionConfig(): SequelizeModuleOptions {
    return loadDatabaseConfig('production');
  }
}

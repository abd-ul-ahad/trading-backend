require('dotenv').config();

/**
 * Sequelize CLI configuration file
 * 
 * This file is used by Sequelize CLI for migrations and seeders.
 * It mirrors the configuration in DatabaseConfigService but in plain JavaScript format.
 * 
 * Environment-specific configurations:
 * - Development: SQLite with file storage (./dev.sqlite3)
 * - Test: SQLite with in-memory storage
 * - Production: Configurable dialect with SSL support and connection pooling
 */

module.exports = {
  development: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'nestjs_db',
    logging: console.log,
  },

  test: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE_TEST || 'nestjs_db_test',
    logging: false,
  },

  production: {
    dialect: process.env.DB_DIALECT || 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
      evict: 10000,
    },
    dialectOptions: {
      ssl:
        process.env.DB_DIALECT === 'postgres' ||
        process.env.DB_DIALECT === 'mysql'
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : undefined,
    },
  },
};

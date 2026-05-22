import { Injectable } from '@nestjs/common';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

/**
 * Database configuration service for PostgreSQL
 *
 * Supports three environments:
 * - Development: PostgreSQL with console logging
 * - Test: PostgreSQL with separate test database
 * - Production: PostgreSQL with connection pooling
 */
@Injectable()
export class DatabaseConfigService {
  /**
   * Get database configuration based on NODE_ENV
   */
  getConfig(): SequelizeModuleOptions {
    const env = process.env.NODE_ENV || 'development';

    switch (env) {
      case 'production':
        return this.getProductionConfig();
      case 'test':
        return this.getTestConfig();
      case 'development':
      default:
        return this.getDevelopmentConfig();
    }
  }

  /**
   * Development configuration using PostgreSQL
   */
  getDevelopmentConfig(): SequelizeModuleOptions {
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

  /**
   * Test configuration using PostgreSQL with separate test database
   */
  getTestConfig(): SequelizeModuleOptions {
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

  /**
   * Production configuration with connection pooling
   */
  getProductionConfig(): SequelizeModuleOptions {
    this.validateProductionEnvVars();

    const host = process.env.DB_HOST;
    const port = parseInt(process.env.DB_PORT || '5432', 10);
    const username = process.env.DB_USERNAME;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_DATABASE;

    const poolMax = parseInt(process.env.DB_POOL_MAX || '5', 10);
    const poolMin = parseInt(process.env.DB_POOL_MIN || '0', 10);

    return {
      dialect: 'postgres',
      host,
      port,
      username,
      password,
      database,
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

  /**
   * Validate required environment variables for production
   */
  private validateProductionEnvVars(): void {
    const requiredVars = [
      'DB_HOST',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_DATABASE',
    ];
    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`,
      );
    }

    if (process.env.DB_PORT) {
      const port = parseInt(process.env.DB_PORT, 10);
      if (isNaN(port) || port <= 0 || port > 65535) {
        throw new Error(`Invalid DB_PORT: ${process.env.DB_PORT}`);
      }
    }
  }
}

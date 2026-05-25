import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { loadDatabaseConfig } from '../config/database.config';
import { Trade } from './models/trade.model';
import { Strategy } from './models/strategy.model';
import { AccountPerformance } from './models/account-performance.model';
import { StrategyPerformance } from './models/strategy-performance.model';
import { RealTimeTrade } from './models/real-time-trade.model';
import { RealTimeAccount } from './models/real-time-account.model';
import { RealTimeStrategy } from './models/real-time-strategy.model';

/**
 * Database module that configures Sequelize ORM for PostgreSQL.
 *
 * Config is sourced from `src/config/database.config.ts` — the same module
 * that powers sequelize-cli (via the .js shim). No duplication.
 *
 * Features:
 *  - Connection pooling (DB_POOL_MIN / DB_POOL_MAX) in production.
 *  - Environment-based query logging.
 *  - 30-second statement timeout.
 *  - All app models registered for DI.
 *  - Production-safe (synchronize disabled — migrations own the schema).
 */
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: () => {
        const config = loadDatabaseConfig();

        config.dialectOptions = {
          ...config.dialectOptions,
          statement_timeout: 30000,
        };

        config.models = [
          Trade,
          Strategy,
          AccountPerformance,
          StrategyPerformance,
          RealTimeTrade,
          RealTimeAccount,
          RealTimeStrategy,
        ];

        return config;
      },
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}

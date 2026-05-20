import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseConfigService } from '../config/database.config';
import { Trade } from './models/trade.model';
import { Strategy } from './models/strategy.model';
import { AccountPerformance } from './models/account-performance.model';
import { StrategyPerformance } from './models/strategy-performance.model';
import { RealTimeTrade } from './models/real-time-trade.model';
import { RealTimeAccount } from './models/real-time-account.model';
import { RealTimeStrategy } from './models/real-time-strategy.model';

/**
 * Database module that configures Sequelize ORM for PostgreSQL
 *
 * Features:
 * - Connection pooling (min: 5, max: 20 connections)
 * - Environment-based query logging
 * - 30-second query timeout
 * - Model registration (User, Post)
 * - Production-safe (synchronize disabled)
 */
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: () => {
        const configService = new DatabaseConfigService();
        const config = configService.getConfig();

        // Add query timeout for PostgreSQL (30 seconds)
        config.dialectOptions = {
          ...config.dialectOptions,
          statement_timeout: 30000,
        };

        // Register models with Sequelize
        // This makes them available for dependency injection in services and controllers
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

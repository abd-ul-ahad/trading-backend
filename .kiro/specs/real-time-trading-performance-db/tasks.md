# Implementation Plan: Real-Time Trading Performance Database Schema

## Overview

This implementation plan creates a PostgreSQL database schema optimized for real-time trading performance monitoring with historical analytics capabilities. The schema uses a dual-table architecture: historical tables for analytics and dedicated real-time tables for sub-second granularity live dashboards. All synchronization is handled automatically via PostgreSQL triggers.

**Key Implementation Areas**:
- Database migrations for 6 tables (3 historical + 3 real-time)
- PostgreSQL trigger functions for automatic timestamp updates and real-time synchronization
- Sequelize models with TypeScript types for all 6 tables
- Optimized indexes (max 5 per table) for query performance
- Comprehensive testing (schema validation, trigger behavior, query performance, data integrity)

**Performance Targets**:
- Open trades query: < 100ms for accounts with up to 1000 open trades
- Current account equity query: < 50ms
- Current strategy performance query: < 50ms

## Tasks

- [x] 1. Create database migration for historical tables
  - [x] 1.1 Create migration file for trades table
    - Create migration file `src/database/migrations/YYYYMMDDHHMMSS-create-trades-table.ts`
    - Define trades table schema with all columns: trade_id (UUID PK), strategy_id, account_id, symbol, direction, entry_time, entry_price, exit_time, exit_price, quantity, pnl, status, last_updated, created_at, updated_at
    - Add CHECK constraints for direction ('long', 'short') and status ('open', 'closed', 'cancelled')
    - Add NOT NULL constraints on required fields (strategy_id, account_id, symbol, direction, entry_time, entry_price, quantity, status, last_updated)
    - Add DEFAULT CURRENT_TIMESTAMP for last_updated, created_at, updated_at
    - _Requirements: 1.1, 1.2, 1.3, 10.3, 10.5_
  
  - [x] 1.2 Create indexes for trades table
    - Add composite index `idx_trades_account_status` on (account_id, status)
    - Add composite index `idx_trades_strategy_status` on (strategy_id, status)
    - Add index `idx_trades_last_updated` on (last_updated DESC)
    - Add index `idx_trades_entry_time` on (entry_time DESC)
    - Add index `idx_trades_symbol` on (symbol)
    - Add migration comments documenting query pattern justification for each index
    - _Requirements: 1.4, 1.5, 1.6, 7.1, 7.3, 7.5, 7.7_
  
  - [x] 1.3 Create migration file for account_performance table
    - Create migration file `src/database/migrations/YYYYMMDDHHMMSS-create-account-performance-table.ts`
    - Define account_performance table schema with all columns: id (UUID PK), account_id, timestamp, balance, equity, margin_used, margin_available, margin_level, unrealized_pnl, realized_pnl, total_pnl, drawdown, last_updated, created_at, updated_at
    - Use DECIMAL(18, 8) for financial metrics (balance, equity, margin_used, margin_available, unrealized_pnl, realized_pnl, total_pnl)
    - Use DECIMAL(10, 4) for percentages (margin_level, drawdown)
    - Add CHECK constraint for margin_level (>= 0 AND <= 1000)
    - Add NOT NULL constraints on all fields
    - _Requirements: 2.1, 2.2, 2.3, 10.3, 10.4_
  
  - [x] 1.4 Create indexes for account_performance table
    - Add composite index `idx_account_perf_account_last_updated` on (account_id, last_updated DESC)
    - Add composite index `idx_account_perf_account_timestamp` on (account_id, timestamp DESC)
    - Add index `idx_account_perf_timestamp` on (timestamp DESC)
    - Add migration comments documenting query pattern justification
    - _Requirements: 2.4, 2.5, 7.1, 7.3, 7.5, 7.7_
  
  - [x] 1.5 Create migration file for strategy_performance table
    - Create migration file `src/database/migrations/YYYYMMDDHHMMSS-create-strategy-performance-table.ts`
    - Define strategy_performance table schema with all columns: id (UUID PK), strategy_id, account_id, timestamp, total_trades, winning_trades, losing_trades, win_rate, total_pnl, unrealized_pnl, realized_pnl, max_drawdown, current_drawdown, last_updated, created_at, updated_at
    - Use INTEGER for trade counters (total_trades, winning_trades, losing_trades)
    - Use DECIMAL(5, 4) for win_rate
    - Use DECIMAL(18, 8) for PnL metrics
    - Use DECIMAL(10, 4) for drawdown metrics
    - Add NOT NULL constraints with DEFAULT 0 for numeric fields
    - _Requirements: 3.1, 3.2, 3.3, 10.3_
  
  - [x] 1.6 Create indexes for strategy_performance table
    - Add composite index `idx_strategy_perf_strategy_last_updated` on (strategy_id, last_updated DESC)
    - Add composite index `idx_strategy_perf_account_strategy_timestamp` on (account_id, strategy_id, timestamp DESC)
    - Add index `idx_strategy_perf_timestamp` on (timestamp DESC)
    - Add migration comments documenting query pattern justification
    - _Requirements: 3.4, 3.5, 7.1, 7.3, 7.5, 7.7_

- [x] 2. Create database migration for real-time tables
  - [x] 2.1 Create migration file for real_time_trades table
    - Create migration file `src/database/migrations/YYYYMMDDHHMMSS-create-real-time-trades-table.ts`
    - Define real_time_trades table schema with minimal columns: trade_id (UUID PK), strategy_id, account_id, symbol, direction, entry_time, entry_price, quantity, status, last_updated
    - Add CHECK constraints for direction and status (same as trades table)
    - Add NOT NULL constraints on all fields
    - Add DEFAULT CURRENT_TIMESTAMP for last_updated
    - _Requirements: 4.1, 4.4, 10.3, 10.5_
  
  - [x] 2.2 Create indexes for real_time_trades table
    - Add composite index `idx_rt_trades_account_status` on (account_id, status)
    - Add composite index `idx_rt_trades_strategy_status` on (strategy_id, status)
    - Add index `idx_rt_trades_last_updated` on (last_updated DESC)
    - Add migration comments documenting query pattern justification
    - _Requirements: 7.1, 7.3, 7.5, 7.7_
  
  - [x] 2.3 Create migration file for real_time_accounts table
    - Create migration file `src/database/migrations/YYYYMMDDHHMMSS-create-real-time-accounts-table.ts`
    - Define real_time_accounts table schema: account_id (UUID PK), balance, equity, margin_used, margin_available, margin_level, unrealized_pnl, total_pnl, last_updated
    - Use DECIMAL(18, 8) for financial metrics
    - Use DECIMAL(10, 4) for margin_level
    - Add CHECK constraint for margin_level (>= 0 AND <= 1000)
    - Add NOT NULL constraints on all fields
    - _Requirements: 4.2, 4.5, 10.3, 10.4_
  
  - [x] 2.4 Create migration file for real_time_strategies table
    - Create migration file `src/database/migrations/YYYYMMDDHHMMSS-create-real-time-strategies-table.ts`
    - Define real_time_strategies table schema: strategy_id (UUID PK), account_id, total_pnl, unrealized_pnl, current_drawdown, last_updated
    - Use DECIMAL(18, 8) for PnL metrics
    - Use DECIMAL(10, 4) for current_drawdown
    - Add NOT NULL constraints with DEFAULT 0 for numeric fields
    - Add index `idx_rt_strategies_account` on (account_id)
    - _Requirements: 4.3, 4.6, 10.3_

- [x] 3. Create PostgreSQL trigger functions
  - [x] 3.1 Create migration file for update_last_updated_column trigger function
    - Create migration file `src/database/migrations/YYYYMMDDHHMMSS-create-update-last-updated-trigger.ts`
    - Implement trigger function that sets NEW.last_updated = CURRENT_TIMESTAMP
    - Attach trigger to trades table (BEFORE UPDATE)
    - Attach trigger to account_performance table (BEFORE UPDATE)
    - Attach trigger to strategy_performance table (BEFORE UPDATE)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [x] 3.2 Create migration file for sync_real_time_trades trigger function
    - Create migration file `src/database/migrations/YYYYMMDDHHMMSS-create-sync-real-time-trades-trigger.ts`
    - Implement trigger function that inserts/updates real_time_trades on trades INSERT/UPDATE
    - Use ON CONFLICT (trade_id) DO UPDATE for upsert behavior
    - Include cleanup logic to DELETE closed trades older than 24 hours
    - Attach trigger to trades table (AFTER INSERT OR UPDATE)
    - _Requirements: 6.1, 6.4, 6.5, 8.4, 8.7_
  
  - [x] 3.3 Create migration file for sync_real_time_accounts trigger function
    - Create migration file `src/database/migrations/YYYYMMDDHHMMSS-create-sync-real-time-accounts-trigger.ts`
    - Implement trigger function that upserts real_time_accounts on account_performance INSERT/UPDATE
    - Use ON CONFLICT (account_id) DO UPDATE to replace previous state
    - Attach trigger to account_performance table (AFTER INSERT OR UPDATE)
    - _Requirements: 6.2, 6.6, 8.5_
  
  - [x] 3.4 Create migration file for sync_real_time_strategies trigger function
    - Create migration file `src/database/migrations/YYYYMMDDHHMMSS-create-sync-real-time-strategies-trigger.ts`
    - Implement trigger function that upserts real_time_strategies on strategy_performance INSERT/UPDATE
    - Use ON CONFLICT (strategy_id) DO UPDATE to replace previous state
    - Attach trigger to strategy_performance table (AFTER INSERT OR UPDATE)
    - _Requirements: 6.3, 6.7, 8.6_

- [x] 4. Checkpoint - Verify migrations and run them
  - Run all migrations against test database
  - Verify all tables, indexes, constraints, and triggers are created correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create Sequelize models for historical tables
  - [x] 5.1 Create Trade model
    - Create file `src/database/models/trade.model.ts`
    - Define Trade class extending BaseModel
    - Add columns: trade_id (UUID PK), strategy_id, account_id, symbol, direction, entry_time, entry_price, exit_time, exit_price, quantity, pnl, status, last_updated
    - Define TypeScript enums for direction ('long' | 'short') and status ('open' | 'closed' | 'cancelled')
    - Use @Column decorators with DataType.DECIMAL(18, 8) for prices and quantities
    - Use @Column decorators with DataType.UUID for IDs
    - Add model to src/database/models/index.ts exports
    - _Requirements: 11.1, 11.7_
  
  - [x] 5.2 Create AccountPerformance model
    - Create file `src/database/models/account-performance.model.ts`
    - Define AccountPerformance class extending BaseModel
    - Add columns: id (UUID PK from BaseModel), account_id, timestamp, balance, equity, margin_used, margin_available, margin_level, unrealized_pnl, realized_pnl, total_pnl, drawdown, last_updated
    - Use @Column decorators with DataType.DECIMAL(18, 8) for financial metrics
    - Use @Column decorators with DataType.DECIMAL(10, 4) for percentages
    - Add validation decorator for margin_level range (0-1000)
    - Add model to src/database/models/index.ts exports
    - _Requirements: 11.2, 11.7_
  
  - [x] 5.3 Create StrategyPerformance model
    - Create file `src/database/models/strategy-performance.model.ts`
    - Define StrategyPerformance class extending BaseModel
    - Add columns: id (UUID PK from BaseModel), strategy_id, account_id, timestamp, total_trades, winning_trades, losing_trades, win_rate, total_pnl, unrealized_pnl, realized_pnl, max_drawdown, current_drawdown, last_updated
    - Use @Column decorators with DataType.INTEGER for trade counters
    - Use @Column decorators with DataType.DECIMAL(5, 4) for win_rate
    - Use @Column decorators with DataType.DECIMAL(18, 8) for PnL metrics
    - Use @Column decorators with DataType.DECIMAL(10, 4) for drawdown metrics
    - Add model to src/database/models/index.ts exports
    - _Requirements: 11.3, 11.7_

- [ ] 6. Create Sequelize models for real-time tables
  - [x] 6.1 Create RealTimeTrade model
    - Create file `src/database/models/real-time-trade.model.ts`
    - Define RealTimeTrade class extending Model (not BaseModel, since it doesn't use standard id/timestamps)
    - Add columns: trade_id (UUID PK), strategy_id, account_id, symbol, direction, entry_time, entry_price, quantity, status, last_updated
    - Define TypeScript enums for direction and status (same as Trade model)
    - Use @Column decorators with appropriate data types
    - Add model to src/database/models/index.ts exports
    - _Requirements: 11.4, 11.7_
  
  - [x] 6.2 Create RealTimeAccount model
    - Create file `src/database/models/real-time-account.model.ts`
    - Define RealTimeAccount class extending Model
    - Add columns: account_id (UUID PK), balance, equity, margin_used, margin_available, margin_level, unrealized_pnl, total_pnl, last_updated
    - Use @Column decorators with DataType.DECIMAL for financial metrics
    - Add validation decorator for margin_level range (0-1000)
    - Add model to src/database/models/index.ts exports
    - _Requirements: 11.5, 11.7_
  
  - [x] 6.3 Create RealTimeStrategy model
    - Create file `src/database/models/real-time-strategy.model.ts`
    - Define RealTimeStrategy class extending Model
    - Add columns: strategy_id (UUID PK), account_id, total_pnl, unrealized_pnl, current_drawdown, last_updated
    - Use @Column decorators with DataType.DECIMAL for PnL and drawdown metrics
    - Add model to src/database/models/index.ts exports
    - _Requirements: 11.6, 11.7_

- [x] 7. Register models with DatabaseModule
  - Update src/database/database.module.ts to register all 6 models in config.models array
  - Import Trade, AccountPerformance, StrategyPerformance, RealTimeTrade, RealTimeAccount, RealTimeStrategy
  - Add all models to the models array in SequelizeModule.forRootAsync configuration
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 8. Checkpoint - Verify models and run basic CRUD tests
  - Verify all models are registered and can connect to database
  - Test basic CRUD operations for each model
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 9. Create schema validation tests
  - [ ]* 9.1 Write tests for table existence
    - Create test file `src/database/models/__tests__/schema-validation.spec.ts`
    - Write test to verify trades, account_performance, strategy_performance tables exist
    - Write test to verify real_time_trades, real_time_accounts, real_time_strategies tables exist
    - Use information_schema.tables query to check table existence
  
  - [ ]* 9.2 Write tests for column definitions
    - Write test to verify trades table has correct columns with correct data types
    - Write test to verify DECIMAL(18, 8) precision for prices and quantities
    - Write test to verify DECIMAL(10, 4) precision for percentages
    - Write test to verify VARCHAR lengths match specification
    - Use information_schema.columns query to check column definitions
  
  - [ ]* 9.3 Write tests for primary keys and indexes
    - Write test to verify primary keys on all tables
    - Write test to verify idx_trades_account_status exists on (account_id, status)
    - Write test to verify idx_trades_strategy_status exists on (strategy_id, status)
    - Write test to verify all other indexes per specification
    - Write test to verify no more than 5 indexes per table
    - Use pg_indexes view to check index definitions
  
  - [ ]* 9.4 Write tests for constraints
    - Write test to verify CHECK constraints on direction, status, margin_level
    - Write test to verify NOT NULL constraints on required fields
    - Write test to verify DEFAULT values on timestamp fields
    - Use information_schema.check_constraints and information_schema.columns to verify constraints

- [ ]* 10. Create trigger behavior tests
  - [ ]* 10.1 Write tests for automatic timestamp updates
    - Create test file `src/database/models/__tests__/trigger-behavior.spec.ts`
    - Write test to verify last_updated is set on trade INSERT
    - Write test to verify last_updated is updated on trade UPDATE
    - Write test to verify last_updated changes even if not explicitly set in UPDATE
    - Write similar tests for account_performance and strategy_performance
  
  - [ ]* 10.2 Write tests for real-time trade synchronization
    - Write test to verify open trade is synced to real_time_trades on INSERT
    - Write test to verify trade update is synced to real_time_trades
    - Write test to verify closed trades remain in real_time_trades for 24 hours
    - Write test to verify closed trades older than 24 hours are removed
  
  - [ ]* 10.3 Write tests for real-time account synchronization
    - Write test to verify account performance snapshot is upserted to real_time_accounts
    - Write test to verify second snapshot for same account replaces previous state
    - Write test to verify only one row exists per account in real_time_accounts
  
  - [ ]* 10.4 Write tests for real-time strategy synchronization
    - Write test to verify strategy performance snapshot is upserted to real_time_strategies
    - Write test to verify second snapshot for same strategy replaces previous state
    - Write test to verify only one row exists per strategy in real_time_strategies

- [ ]* 11. Create query performance tests
  - [ ]* 11.1 Write test for open trades query performance
    - Create test file `src/database/models/__tests__/query-performance.spec.ts`
    - Insert 1000 open trades for test account
    - Query open trades by account_id and status = 'open'
    - Measure query duration and verify < 100ms
  
  - [ ]* 11.2 Write test for current account equity query performance
    - Insert account performance snapshot
    - Query current equity by account_id from real_time_accounts
    - Measure query duration and verify < 50ms
  
  - [ ]* 11.3 Write test for current strategy performance query performance
    - Insert strategy performance snapshot
    - Query current performance by strategy_id from real_time_strategies
    - Measure query duration and verify < 50ms
  
  - [ ]* 11.4 Write test for index usage verification
    - Use EXPLAIN ANALYZE to verify queries use expected indexes
    - Verify idx_rt_trades_account_status is used for open trades query
    - Verify no full table scans on real-time tables

- [ ]* 12. Create data integrity tests
  - [ ]* 12.1 Write tests for CHECK constraint validation
    - Create test file `src/database/models/__tests__/data-integrity.spec.ts`
    - Write test to verify trade with invalid direction is rejected
    - Write test to verify trade with invalid status is rejected
    - Write test to verify account with margin_level = -1 is rejected
    - Write test to verify account with margin_level = 1001 is rejected
  
  - [ ]* 12.2 Write tests for NOT NULL constraint validation
    - Write test to verify trade without symbol is rejected
    - Write test to verify trade without entry_time is rejected
    - Write test to verify account performance without account_id is rejected
  
  - [ ]* 12.3 Write tests for foreign key constraint validation (placeholder for future)
    - Add TODO comments for foreign key tests when account/strategy tables are implemented
    - Document expected behavior: reject trade with non-existent account_id or strategy_id

- [ ]* 13. Create Sequelize model tests
  - [ ]* 13.1 Write CRUD operation tests for Trade model
    - Create test file `src/database/models/__tests__/trade.model.spec.ts`
    - Write test to create and persist trade
    - Write test to read trade using Trade.findByPk()
    - Write test to update trade and verify changes persist
    - Write test to soft delete trade and verify deletedAt is set
  
  - [ ]* 13.2 Write CRUD operation tests for AccountPerformance model
    - Create test file `src/database/models/__tests__/account-performance.model.spec.ts`
    - Write test to create and persist account performance snapshot
    - Write test to read account performance using AccountPerformance.findByPk()
    - Write test to query historical snapshots by account_id and timestamp range
  
  - [ ]* 13.3 Write CRUD operation tests for StrategyPerformance model
    - Create test file `src/database/models/__tests__/strategy-performance.model.spec.ts`
    - Write test to create and persist strategy performance snapshot
    - Write test to read strategy performance using StrategyPerformance.findByPk()
    - Write test to query historical snapshots by strategy_id and timestamp range
  
  - [ ]* 13.4 Write read operation tests for real-time models
    - Create test file `src/database/models/__tests__/real-time-models.spec.ts`
    - Write test to verify RealTimeTrade is populated by trigger (read-only from app perspective)
    - Write test to verify RealTimeAccount is populated by trigger
    - Write test to verify RealTimeStrategy is populated by trigger
    - Document that real-time models are read-only from application perspective

- [ ] 14. Final checkpoint - Run all tests and verify implementation
  - Run all unit tests and integration tests
  - Verify all migrations can be applied and rolled back cleanly
  - Verify all models work correctly with database
  - Verify all triggers function as expected
  - Verify query performance meets targets
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Real-time tables are managed by triggers and should be treated as read-only from application code
- Foreign key constraints to account and strategy tables will be added in future specs when those tables are implemented
- All migrations should include both `up` and `down` methods for rollback capability
- Use Sequelize CLI for migration generation: `npx sequelize-cli migration:generate --name <migration-name>`
- Test database should be separate from development database (nestjs_db_test)
- Performance tests should run against database with realistic data volumes (1000+ records)

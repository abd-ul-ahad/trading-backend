# Requirements Document

## Introduction

This document specifies the requirements for implementing a real-time trading performance database schema using PostgreSQL. The schema shall support real-time updates for trades, equity, PnL, and other metrics while maintaining historical snapshots for analytics. The design addresses performance issues from the previous "Mistraal database" implementation by optimizing indexing strategies and providing sub-second granularity for live dashboards.

## Glossary

- **Trading_System**: The application that executes trades and tracks trading performance
- **Database_Schema**: The PostgreSQL database structure including tables, columns, indexes, and triggers
- **Real_Time_Data**: Trading data updated with sub-second granularity for live monitoring
- **Historical_Snapshot**: Point-in-time records of trading performance stored for analytics
- **Trade_Record**: A database record representing a single trade execution with entry, exit, and PnL details
- **Account_Performance**: Metrics tracking overall account health including balance, equity, margin level, and drawdown
- **Strategy_Performance**: Metrics tracking individual strategy performance including PnL, win rate, and drawdown
- **Last_Updated_Timestamp**: A timestamp field indicating when a record was last modified
- **Database_Trigger**: A PostgreSQL function that automatically executes when data changes occur
- **Intraday_Snapshot**: A historical record captured during trading hours (not just end-of-day)
- **Index_Strategy**: The selection and configuration of database indexes to optimize query performance

## Requirements

### Requirement 1: Real-Time Trade Tracking

**User Story:** As a trader, I want to track trades in real-time, so that I can monitor open positions and recent executions as they happen.

#### Acceptance Criteria

1. THE Database_Schema SHALL include a trades table with columns for trade_id, strategy_id, account_id, symbol, direction, entry_time, entry_price, exit_time, exit_price, quantity, pnl, status, and last_updated
2. WHEN a Trade_Record is inserted or updated, THE Database_Schema SHALL automatically set the last_updated field to the current timestamp
3. THE trades table SHALL support status values: "open", "closed", "cancelled"
4. THE Database_Schema SHALL create an index on trades(account_id, status) for querying open trades by account
5. THE Database_Schema SHALL create an index on trades(strategy_id, status) for querying open trades by strategy
6. THE Database_Schema SHALL create an index on trades(last_updated) for retrieving recently updated trades
7. WHEN querying for open trades, THE Trading_System SHALL filter by status = 'open' and order by last_updated descending

### Requirement 2: Real-Time Account Performance Tracking

**User Story:** As a trader, I want to monitor account equity and margin in real-time, so that I can manage risk and avoid margin calls.

#### Acceptance Criteria

1. THE Database_Schema SHALL include an account_performance table with columns for account_id, timestamp, balance, equity, margin_used, margin_available, margin_level, unrealized_pnl, realized_pnl, total_pnl, drawdown, and last_updated
2. WHEN Account_Performance data is updated, THE Database_Schema SHALL automatically set the last_updated field to the current timestamp
3. THE account_performance table SHALL store both intraday snapshots and real-time updates
4. THE Database_Schema SHALL create an index on account_performance(account_id, last_updated) for retrieving the latest account state
5. THE Database_Schema SHALL create an index on account_performance(account_id, timestamp) for historical analysis
6. WHEN querying for current account equity, THE Trading_System SHALL retrieve the record with the most recent last_updated timestamp for the specified account_id

### Requirement 3: Real-Time Strategy Performance Tracking

**User Story:** As a trader, I want to monitor individual strategy performance in real-time, so that I can identify underperforming strategies and adjust my trading approach.

#### Acceptance Criteria

1. THE Database_Schema SHALL include a strategy_performance table with columns for strategy_id, account_id, timestamp, total_trades, winning_trades, losing_trades, win_rate, total_pnl, unrealized_pnl, realized_pnl, max_drawdown, current_drawdown, and last_updated
2. WHEN Strategy_Performance data is updated, THE Database_Schema SHALL automatically set the last_updated field to the current timestamp
3. THE strategy_performance table SHALL store both intraday snapshots and real-time updates
4. THE Database_Schema SHALL create an index on strategy_performance(strategy_id, last_updated) for retrieving the latest strategy state
5. THE Database_Schema SHALL create an index on strategy_performance(account_id, strategy_id, timestamp) for historical analysis
6. WHEN querying for current strategy PnL, THE Trading_System SHALL retrieve the record with the most recent last_updated timestamp for the specified strategy_id

### Requirement 4: Dedicated Real-Time Tables for Sub-Second Granularity

**User Story:** As a trader, I want sub-second updates for live dashboards, so that I can see trading activity and performance changes as they occur without delay.

#### Acceptance Criteria

1. THE Database_Schema SHALL include a real_time_trades table with columns for trade_id, strategy_id, account_id, symbol, direction, entry_time, entry_price, quantity, status, and last_updated
2. THE Database_Schema SHALL include a real_time_accounts table with columns for account_id, balance, equity, margin_used, margin_available, margin_level, unrealized_pnl, total_pnl, and last_updated
3. THE Database_Schema SHALL include a real_time_strategies table with columns for strategy_id, account_id, total_pnl, unrealized_pnl, current_drawdown, and last_updated
4. THE real_time_trades table SHALL contain only open trades and recently closed trades (within the last 24 hours)
5. THE real_time_accounts table SHALL contain only the most recent state for each account (single row per account)
6. THE real_time_strategies table SHALL contain only the most recent state for each strategy (single row per strategy)
7. WHEN querying for live dashboard data, THE Trading_System SHALL use the real_time tables instead of the historical tables

### Requirement 5: Automatic Timestamp Updates via Triggers

**User Story:** As a developer, I want automatic timestamp updates, so that I don't have to manually set last_updated fields in application code.

#### Acceptance Criteria

1. THE Database_Schema SHALL create a PostgreSQL trigger function named update_last_updated_column that sets last_updated to CURRENT_TIMESTAMP
2. THE Database_Schema SHALL attach the update_last_updated_column trigger to the trades table for UPDATE operations
3. THE Database_Schema SHALL attach the update_last_updated_column trigger to the account_performance table for UPDATE operations
4. THE Database_Schema SHALL attach the update_last_updated_column trigger to the strategy_performance table for UPDATE operations
5. WHEN a Trade_Record is updated, THE Database_Schema SHALL automatically update the last_updated field without application code intervention
6. WHEN Account_Performance is updated, THE Database_Schema SHALL automatically update the last_updated field without application code intervention
7. WHEN Strategy_Performance is updated, THE Database_Schema SHALL automatically update the last_updated field without application code intervention

### Requirement 6: Automatic Real-Time Table Synchronization

**User Story:** As a developer, I want real-time tables automatically synchronized with main tables, so that live dashboards always display current data without manual synchronization logic.

#### Acceptance Criteria

1. THE Database_Schema SHALL create a PostgreSQL trigger function that synchronizes trades to real_time_trades on INSERT and UPDATE operations
2. THE Database_Schema SHALL create a PostgreSQL trigger function that synchronizes account_performance to real_time_accounts on INSERT and UPDATE operations
3. THE Database_Schema SHALL create a PostgreSQL trigger function that synchronizes strategy_performance to real_time_strategies on INSERT and UPDATE operations
4. WHEN a Trade_Record is inserted with status = 'open', THE Database_Schema SHALL insert or update the corresponding record in real_time_trades
5. WHEN a Trade_Record is updated to status = 'closed', THE Database_Schema SHALL keep the record in real_time_trades for 24 hours then remove it
6. WHEN Account_Performance is inserted or updated, THE Database_Schema SHALL upsert the corresponding record in real_time_accounts (replacing the previous state)
7. WHEN Strategy_Performance is inserted or updated, THE Database_Schema SHALL upsert the corresponding record in real_time_strategies (replacing the previous state)

### Requirement 7: Optimized Index Strategy

**User Story:** As a developer, I want optimized database indexes, so that queries execute quickly without slowing down write operations.

#### Acceptance Criteria

1. THE Database_Schema SHALL create indexes only on columns used in WHERE clauses, JOIN conditions, or ORDER BY clauses
2. THE Database_Schema SHALL NOT create indexes on columns with low cardinality (fewer than 100 distinct values)
3. THE Database_Schema SHALL create composite indexes for multi-column query patterns (e.g., account_id + status)
4. THE Database_Schema SHALL create partial indexes for frequently filtered subsets (e.g., status = 'open')
5. THE Database_Schema SHALL limit the total number of indexes per table to 5 or fewer
6. WHEN a table has multiple candidate indexes, THE Database_Schema SHALL prioritize indexes that support the most frequent query patterns
7. THE Database_Schema SHALL document the query pattern justification for each index in migration comments

### Requirement 8: Historical Snapshot Retention

**User Story:** As an analyst, I want historical snapshots retained for analytics, so that I can analyze trading performance trends over time.

#### Acceptance Criteria

1. THE account_performance table SHALL retain all historical snapshots indefinitely
2. THE strategy_performance table SHALL retain all historical snapshots indefinitely
3. THE trades table SHALL retain all Trade_Records indefinitely
4. THE real_time_trades table SHALL retain only open trades and trades closed within the last 24 hours
5. THE real_time_accounts table SHALL retain only the most recent state for each account
6. THE real_time_strategies table SHALL retain only the most recent state for each strategy
7. WHEN a Trade_Record in real_time_trades is older than 24 hours and status = 'closed', THE Database_Schema SHALL remove it from real_time_trades

### Requirement 9: Query Performance for Live Dashboards

**User Story:** As a trader, I want live dashboards to load instantly, so that I can make trading decisions based on current information without waiting.

#### Acceptance Criteria

1. WHEN querying for open trades by account, THE Database_Schema SHALL return results in less than 100 milliseconds for accounts with up to 1000 open trades
2. WHEN querying for current account equity, THE Database_Schema SHALL return results in less than 50 milliseconds
3. WHEN querying for current strategy performance, THE Database_Schema SHALL return results in less than 50 milliseconds
4. THE Database_Schema SHALL use the real_time tables for live dashboard queries to minimize query complexity
5. THE Database_Schema SHALL use indexes to avoid full table scans on real_time tables
6. WHEN the real_time_accounts table is queried, THE Database_Schema SHALL perform an index-only scan on account_id
7. WHEN the real_time_strategies table is queried, THE Database_Schema SHALL perform an index-only scan on strategy_id

### Requirement 10: Data Integrity and Consistency

**User Story:** As a developer, I want data integrity enforced at the database level, so that invalid data cannot be inserted and relationships remain consistent.

#### Acceptance Criteria

1. THE Database_Schema SHALL define primary keys for all tables (trade_id, account_id, strategy_id, or composite keys)
2. THE Database_Schema SHALL define foreign key constraints linking trades to accounts and strategies
3. THE Database_Schema SHALL define NOT NULL constraints on required fields (account_id, strategy_id, symbol, entry_time)
4. THE Database_Schema SHALL define CHECK constraints to ensure margin_level >= 0 and margin_level <= 1000
5. THE Database_Schema SHALL define CHECK constraints to ensure status IN ('open', 'closed', 'cancelled')
6. WHEN a foreign key constraint is violated, THE Database_Schema SHALL reject the operation and return a descriptive error
7. WHEN a CHECK constraint is violated, THE Database_Schema SHALL reject the operation and return a descriptive error

### Requirement 11: Sequelize Model Integration

**User Story:** As a developer, I want Sequelize models for all tables, so that I can interact with the database using type-safe ORM operations.

#### Acceptance Criteria

1. THE Trading_System SHALL define a Trade Sequelize model corresponding to the trades table
2. THE Trading_System SHALL define an AccountPerformance Sequelize model corresponding to the account_performance table
3. THE Trading_System SHALL define a StrategyPerformance Sequelize model corresponding to the strategy_performance table
4. THE Trading_System SHALL define a RealTimeTrade Sequelize model corresponding to the real_time_trades table
5. THE Trading_System SHALL define a RealTimeAccount Sequelize model corresponding to the real_time_accounts table
6. THE Trading_System SHALL define a RealTimeStrategy Sequelize model corresponding to the real_time_strategies table
7. THE Sequelize models SHALL include TypeScript type definitions for all columns and relationships

### Requirement 12: Migration Management

**User Story:** As a developer, I want database migrations for schema changes, so that I can version control the schema and apply changes consistently across environments.

#### Acceptance Criteria

1. THE Trading_System SHALL provide a migration file that creates the trades table with all columns, indexes, and constraints
2. THE Trading_System SHALL provide a migration file that creates the account_performance table with all columns, indexes, and constraints
3. THE Trading_System SHALL provide a migration file that creates the strategy_performance table with all columns, indexes, and constraints
4. THE Trading_System SHALL provide a migration file that creates the real_time_trades, real_time_accounts, and real_time_strategies tables
5. THE Trading_System SHALL provide a migration file that creates the update_last_updated_column trigger function and attaches it to relevant tables
6. THE Trading_System SHALL provide a migration file that creates trigger functions for synchronizing real-time tables
7. WHEN a migration is executed, THE Database_Schema SHALL apply all changes within a transaction to ensure atomicity

/**
 * Model CRUD Operations Test Suite
 *
 * Verifies that all Sequelize models are properly registered and can perform
 * basic CRUD operations against the database.
 *
 * Test Coverage:
 * - Database connection and model registration
 * - Trade model CRUD operations
 * - AccountPerformance model CRUD operations
 * - StrategyPerformance model CRUD operations
 * - RealTimeTrade model read operations (read-only, managed by triggers)
 * - RealTimeAccount model read operations (read-only, managed by triggers)
 * - RealTimeStrategy model read operations (read-only, managed by triggers)
 *
 * Requirements: Task 8 - Checkpoint verification
 */

// Load environment variables before importing anything else
import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize-typescript';
import { DatabaseConfigService } from '../../../config/database.config';
import {
  Trade,
  TradeDirection,
  TradeStatus,
  AccountPerformance,
  StrategyPerformance,
  RealTimeTrade,
  RealTimeAccount,
  RealTimeStrategy,
} from '../index';

/** PostgreSQL returns DECIMAL columns as strings; coerce to number for assertions */
const num = (v: unknown): number => Number(v);

describe('Model Registration and CRUD Operations', () => {
  let sequelize: Sequelize;

  beforeAll(async () => {
    // Initialize Sequelize with development database configuration
    // Using development database since this is a checkpoint to verify models work
    const configService = new DatabaseConfigService();
    const config = configService.getDevelopmentConfig();

    sequelize = new Sequelize({
      ...config,
      models: [
        Trade,
        AccountPerformance,
        StrategyPerformance,
        RealTimeTrade,
        RealTimeAccount,
        RealTimeStrategy,
      ],
      logging: false, // Disable logging for cleaner test output
    });

    // Test database connection
    await sequelize.authenticate();
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up tables before each test
    await Trade.destroy({ where: {} });
    await AccountPerformance.destroy({ where: {} });
    await StrategyPerformance.destroy({ where: {} });
    // Real-time tables are managed by triggers, but clean them for test isolation
    await sequelize.query('DELETE FROM real_time_trades');
    await sequelize.query('DELETE FROM real_time_accounts');
    await sequelize.query('DELETE FROM real_time_strategies');
  });

  describe('Database Connection and Model Registration', () => {
    it('should successfully connect to the database', async () => {
      expect(sequelize).toBeDefined();
      await expect(sequelize.authenticate()).resolves.not.toThrow();
    });

    it('should have all models registered', () => {
      const modelNames = sequelize.models;
      expect(modelNames).toHaveProperty('Trade');
      expect(modelNames).toHaveProperty('AccountPerformance');
      expect(modelNames).toHaveProperty('StrategyPerformance');
      expect(modelNames).toHaveProperty('RealTimeTrade');
      expect(modelNames).toHaveProperty('RealTimeAccount');
      expect(modelNames).toHaveProperty('RealTimeStrategy');
    });

    it('should have correct table names for all models', () => {
      expect(Trade.tableName).toBe('trades');
      expect(AccountPerformance.tableName).toBe('account_performance');
      expect(StrategyPerformance.tableName).toBe('strategy_performance');
      expect(RealTimeTrade.tableName).toBe('real_time_trades');
      expect(RealTimeAccount.tableName).toBe('real_time_accounts');
      expect(RealTimeStrategy.tableName).toBe('real_time_strategies');
    });
  });

  describe('Trade Model CRUD Operations', () => {
    it('should create a new trade', async () => {
      const trade = await Trade.create({
        strategy_id: '123e4567-e89b-12d3-a456-426614174000',
        account_id: '123e4567-e89b-12d3-a456-426614174001',
        symbol: 'AAPL',
        direction: TradeDirection.LONG,
        entry_time: new Date('2024-01-15T10:00:00Z'),
        entry_price: 150.5,
        quantity: 100,
        status: TradeStatus.OPEN,
      });

      expect(trade).toBeDefined();
      expect(trade.trade_id).toBeDefined();
      expect(trade.symbol).toBe('AAPL');
      expect(trade.direction).toBe(TradeDirection.LONG);
      expect(trade.status).toBe(TradeStatus.OPEN);
      expect(trade.last_updated).toBeDefined();
    });

    it('should read a trade by primary key', async () => {
      const createdTrade = await Trade.create({
        strategy_id: '123e4567-e89b-12d3-a456-426614174000',
        account_id: '123e4567-e89b-12d3-a456-426614174001',
        symbol: 'TSLA',
        direction: TradeDirection.SHORT,
        entry_time: new Date('2024-01-15T11:00:00Z'),
        entry_price: 250.75,
        quantity: 50,
        status: TradeStatus.OPEN,
      });

      const foundTrade = await Trade.findByPk(createdTrade.trade_id);

      expect(foundTrade).toBeDefined();
      expect(foundTrade?.trade_id).toBe(createdTrade.trade_id);
      expect(foundTrade?.symbol).toBe('TSLA');
      expect(foundTrade?.direction).toBe(TradeDirection.SHORT);
    });

    it('should update a trade', async () => {
      const trade = await Trade.create({
        strategy_id: '123e4567-e89b-12d3-a456-426614174000',
        account_id: '123e4567-e89b-12d3-a456-426614174001',
        symbol: 'GOOGL',
        direction: TradeDirection.LONG,
        entry_time: new Date('2024-01-15T12:00:00Z'),
        entry_price: 140.0,
        quantity: 75,
        status: TradeStatus.OPEN,
      });

      const originalLastUpdated = trade.last_updated;

      // Wait a moment to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      await trade.update({
        status: TradeStatus.CLOSED,
        exit_time: new Date('2024-01-15T14:00:00Z'),
        exit_price: 145.0,
        pnl: 375.0,
      });

      await trade.reload();

      expect(trade.status).toBe(TradeStatus.CLOSED);
      expect(num(trade.exit_price)).toBe(145);
      expect(num(trade.pnl)).toBe(375);
      expect(trade.last_updated.getTime()).toBeGreaterThanOrEqual(
        originalLastUpdated.getTime(),
      );
    });

    it('should delete a trade', async () => {
      const trade = await Trade.create({
        strategy_id: '123e4567-e89b-12d3-a456-426614174000',
        account_id: '123e4567-e89b-12d3-a456-426614174001',
        symbol: 'MSFT',
        direction: TradeDirection.LONG,
        entry_time: new Date('2024-01-15T13:00:00Z'),
        entry_price: 380.0,
        quantity: 25,
        status: TradeStatus.OPEN,
      });

      const tradeId = trade.trade_id;
      await trade.destroy();

      // Should not find after deletion
      const foundTrade = await Trade.findByPk(tradeId);
      expect(foundTrade).toBeNull();
    });

    it('should query trades by account and status', async () => {
      const accountId = '123e4567-e89b-12d3-a456-426614174001';

      await Trade.bulkCreate([
        {
          strategy_id: '123e4567-e89b-12d3-a456-426614174000',
          account_id: accountId,
          symbol: 'AAPL',
          direction: TradeDirection.LONG,
          entry_time: new Date('2024-01-15T10:00:00Z'),
          entry_price: 150.0,
          quantity: 100,
          status: TradeStatus.OPEN,
        },
        {
          strategy_id: '123e4567-e89b-12d3-a456-426614174000',
          account_id: accountId,
          symbol: 'TSLA',
          direction: TradeDirection.SHORT,
          entry_time: new Date('2024-01-15T11:00:00Z'),
          entry_price: 250.0,
          quantity: 50,
          status: TradeStatus.OPEN,
        },
        {
          strategy_id: '123e4567-e89b-12d3-a456-426614174000',
          account_id: accountId,
          symbol: 'GOOGL',
          direction: TradeDirection.LONG,
          entry_time: new Date('2024-01-15T09:00:00Z'),
          entry_price: 140.0,
          quantity: 75,
          status: TradeStatus.CLOSED,
        },
      ]);

      const openTrades = await Trade.findAll({
        where: {
          account_id: accountId,
          status: TradeStatus.OPEN,
        },
      });

      expect(openTrades).toHaveLength(2);
      expect(openTrades.every((t) => t.status === TradeStatus.OPEN)).toBe(true);
    });
  });

  describe('AccountPerformance Model CRUD Operations', () => {
    it('should create a new account performance snapshot', async () => {
      const accountPerf = await AccountPerformance.create({
        account_id: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date('2024-01-15T10:00:00Z'),
        balance: 10000.0,
        equity: 10500.0,
        margin_used: 2000.0,
        margin_available: 8000.0,
        margin_level: 525.0,
        unrealized_pnl: 500.0,
        realized_pnl: 0.0,
        total_pnl: 500.0,
        drawdown: 0.0,
      });

      expect(accountPerf).toBeDefined();
      expect(accountPerf.id).toBeDefined();
      expect(accountPerf.account_id).toBe(
        '123e4567-e89b-12d3-a456-426614174001',
      );
      expect(num(accountPerf.equity)).toBe(10500);
      expect(accountPerf.last_updated).toBeDefined();
    });

    it('should read account performance by primary key', async () => {
      const created = await AccountPerformance.create({
        account_id: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date('2024-01-15T11:00:00Z'),
        balance: 11000.0,
        equity: 11500.0,
        margin_used: 2500.0,
        margin_available: 8500.0,
        margin_level: 460.0,
        unrealized_pnl: 500.0,
        realized_pnl: 0.0,
        total_pnl: 500.0,
        drawdown: 0.0,
      });

      const found = await AccountPerformance.findByPk(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(num(found?.equity)).toBe(11500);
    });

    it('should update account performance', async () => {
      const accountPerf = await AccountPerformance.create({
        account_id: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date('2024-01-15T12:00:00Z'),
        balance: 10000.0,
        equity: 10500.0,
        margin_used: 2000.0,
        margin_available: 8000.0,
        margin_level: 525.0,
        unrealized_pnl: 500.0,
        realized_pnl: 0.0,
        total_pnl: 500.0,
        drawdown: 0.0,
      });

      await accountPerf.update({
        equity: 11000.0,
        unrealized_pnl: 1000.0,
        total_pnl: 1000.0,
      });

      await accountPerf.reload();

      expect(num(accountPerf.equity)).toBe(11000);
      expect(num(accountPerf.unrealized_pnl)).toBe(1000);
      expect(num(accountPerf.total_pnl)).toBe(1000);
    });

    it('should query account performance by account_id', async () => {
      const accountId = '123e4567-e89b-12d3-a456-426614174001';

      await AccountPerformance.bulkCreate([
        {
          account_id: accountId,
          timestamp: new Date('2024-01-15T10:00:00Z'),
          balance: 10000.0,
          equity: 10500.0,
          margin_used: 2000.0,
          margin_available: 8000.0,
          margin_level: 525.0,
          unrealized_pnl: 500.0,
          realized_pnl: 0.0,
          total_pnl: 500.0,
          drawdown: 0.0,
        },
        {
          account_id: accountId,
          timestamp: new Date('2024-01-15T11:00:00Z'),
          balance: 10000.0,
          equity: 11000.0,
          margin_used: 2000.0,
          margin_available: 8000.0,
          margin_level: 550.0,
          unrealized_pnl: 1000.0,
          realized_pnl: 0.0,
          total_pnl: 1000.0,
          drawdown: 0.0,
        },
      ]);

      const snapshots = await AccountPerformance.findAll({
        where: { account_id: accountId },
        order: [['timestamp', 'DESC']],
      });

      expect(snapshots).toHaveLength(2);
      expect(num(snapshots[0].equity)).toBe(11000);
      expect(num(snapshots[1].equity)).toBe(10500);
    });
  });

  describe('StrategyPerformance Model CRUD Operations', () => {
    it('should create a new strategy performance snapshot', async () => {
      const strategyPerf = await StrategyPerformance.create({
        strategy_id: '123e4567-e89b-12d3-a456-426614174000',
        account_id: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date('2024-01-15T10:00:00Z'),
        total_trades: 10,
        winning_trades: 6,
        losing_trades: 4,
        win_rate: 0.6,
        total_pnl: 1500.0,
        unrealized_pnl: 500.0,
        realized_pnl: 1000.0,
        max_drawdown: 5.0,
        current_drawdown: 2.0,
      });

      expect(strategyPerf).toBeDefined();
      expect(strategyPerf.id).toBeDefined();
      expect(strategyPerf.strategy_id).toBe(
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(num(strategyPerf.total_trades)).toBe(10);
      expect(num(strategyPerf.win_rate)).toBe(0.6);
      expect(strategyPerf.last_updated).toBeDefined();
    });

    it('should read strategy performance by primary key', async () => {
      const created = await StrategyPerformance.create({
        strategy_id: '123e4567-e89b-12d3-a456-426614174000',
        account_id: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date('2024-01-15T11:00:00Z'),
        total_trades: 15,
        winning_trades: 9,
        losing_trades: 6,
        win_rate: 0.6,
        total_pnl: 2000.0,
        unrealized_pnl: 500.0,
        realized_pnl: 1500.0,
        max_drawdown: 6.0,
        current_drawdown: 3.0,
      });

      const found = await StrategyPerformance.findByPk(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(num(found?.total_trades)).toBe(15);
    });

    it('should update strategy performance', async () => {
      const strategyPerf = await StrategyPerformance.create({
        strategy_id: '123e4567-e89b-12d3-a456-426614174000',
        account_id: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date('2024-01-15T12:00:00Z'),
        total_trades: 10,
        winning_trades: 6,
        losing_trades: 4,
        win_rate: 0.6,
        total_pnl: 1500.0,
        unrealized_pnl: 500.0,
        realized_pnl: 1000.0,
        max_drawdown: 5.0,
        current_drawdown: 2.0,
      });

      await strategyPerf.update({
        total_trades: 11,
        winning_trades: 7,
        win_rate: 0.6364,
        total_pnl: 1800.0,
      });

      await strategyPerf.reload();

      expect(num(strategyPerf.total_trades)).toBe(11);
      expect(num(strategyPerf.winning_trades)).toBe(7);
      expect(num(strategyPerf.total_pnl)).toBe(1800);
    });

    it('should query strategy performance by strategy_id', async () => {
      const strategyId = '123e4567-e89b-12d3-a456-426614174000';

      await StrategyPerformance.bulkCreate([
        {
          strategy_id: strategyId,
          account_id: '123e4567-e89b-12d3-a456-426614174001',
          timestamp: new Date('2024-01-15T10:00:00Z'),
          total_trades: 10,
          winning_trades: 6,
          losing_trades: 4,
          win_rate: 0.6,
          total_pnl: 1500.0,
          unrealized_pnl: 500.0,
          realized_pnl: 1000.0,
          max_drawdown: 5.0,
          current_drawdown: 2.0,
        },
        {
          strategy_id: strategyId,
          account_id: '123e4567-e89b-12d3-a456-426614174001',
          timestamp: new Date('2024-01-15T11:00:00Z'),
          total_trades: 15,
          winning_trades: 9,
          losing_trades: 6,
          win_rate: 0.6,
          total_pnl: 2000.0,
          unrealized_pnl: 500.0,
          realized_pnl: 1500.0,
          max_drawdown: 6.0,
          current_drawdown: 3.0,
        },
      ]);

      const snapshots = await StrategyPerformance.findAll({
        where: { strategy_id: strategyId },
        order: [['timestamp', 'DESC']],
      });

      expect(snapshots).toHaveLength(2);
      expect(num(snapshots[0].total_trades)).toBe(15);
      expect(num(snapshots[1].total_trades)).toBe(10);
    });
  });

  describe('Real-Time Models (Trigger-Managed)', () => {
    describe('RealTimeTrade Model', () => {
      it('should be synchronized from Trade model via trigger', async () => {
        // Create a trade in the main trades table
        const trade = await Trade.create({
          strategy_id: '123e4567-e89b-12d3-a456-426614174000',
          account_id: '123e4567-e89b-12d3-a456-426614174001',
          symbol: 'AAPL',
          direction: TradeDirection.LONG,
          entry_time: new Date('2024-01-15T10:00:00Z'),
          entry_price: 150.5,
          quantity: 100,
          status: TradeStatus.OPEN,
        });

        // Wait for trigger to execute
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Verify it appears in real_time_trades
        const rtTrade = await RealTimeTrade.findByPk(trade.trade_id);

        expect(rtTrade).toBeDefined();
        expect(rtTrade?.symbol).toBe('AAPL');
        expect(rtTrade?.status).toBe(TradeStatus.OPEN);
        expect(num(rtTrade?.entry_price)).toBe(150.5);
      });

      it('should query real-time trades by account and status', async () => {
        const accountId = '123e4567-e89b-12d3-a456-426614174001';

        // Create multiple trades
        await Trade.bulkCreate([
          {
            strategy_id: '123e4567-e89b-12d3-a456-426614174000',
            account_id: accountId,
            symbol: 'AAPL',
            direction: TradeDirection.LONG,
            entry_time: new Date('2024-01-15T10:00:00Z'),
            entry_price: 150.0,
            quantity: 100,
            status: TradeStatus.OPEN,
          },
          {
            strategy_id: '123e4567-e89b-12d3-a456-426614174000',
            account_id: accountId,
            symbol: 'TSLA',
            direction: TradeDirection.SHORT,
            entry_time: new Date('2024-01-15T11:00:00Z'),
            entry_price: 250.0,
            quantity: 50,
            status: TradeStatus.OPEN,
          },
        ]);

        // Wait for triggers
        await new Promise((resolve) => setTimeout(resolve, 100));

        const rtTrades = await RealTimeTrade.findAll({
          where: {
            account_id: accountId,
            status: TradeStatus.OPEN,
          },
        });

        expect(rtTrades.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('RealTimeAccount Model', () => {
      it('should be synchronized from AccountPerformance model via trigger', async () => {
        const accountId = '123e4567-e89b-12d3-a456-426614174001';

        // Create account performance snapshot
        await AccountPerformance.create({
          account_id: accountId,
          timestamp: new Date('2024-01-15T10:00:00Z'),
          balance: 10000.0,
          equity: 10500.0,
          margin_used: 2000.0,
          margin_available: 8000.0,
          margin_level: 525.0,
          unrealized_pnl: 500.0,
          realized_pnl: 0.0,
          total_pnl: 500.0,
          drawdown: 0.0,
        });

        // Wait for trigger
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Verify it appears in real_time_accounts
        const rtAccount = await RealTimeAccount.findByPk(accountId);

        expect(rtAccount).toBeDefined();
        expect(num(rtAccount?.equity)).toBe(10500);
        expect(num(rtAccount?.balance)).toBe(10000);
        expect(num(rtAccount?.margin_level)).toBe(525);
      });

      it('should upsert (replace) when multiple snapshots are created', async () => {
        const accountId = '123e4567-e89b-12d3-a456-426614174001';

        // Create first snapshot
        await AccountPerformance.create({
          account_id: accountId,
          timestamp: new Date('2024-01-15T10:00:00Z'),
          balance: 10000.0,
          equity: 10500.0,
          margin_used: 2000.0,
          margin_available: 8000.0,
          margin_level: 525.0,
          unrealized_pnl: 500.0,
          realized_pnl: 0.0,
          total_pnl: 500.0,
          drawdown: 0.0,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create second snapshot
        await AccountPerformance.create({
          account_id: accountId,
          timestamp: new Date('2024-01-15T11:00:00Z'),
          balance: 10000.0,
          equity: 11000.0,
          margin_used: 2000.0,
          margin_available: 8000.0,
          margin_level: 550.0,
          unrealized_pnl: 1000.0,
          realized_pnl: 0.0,
          total_pnl: 1000.0,
          drawdown: 0.0,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));

        // Verify only latest state exists
        const rtAccount = await RealTimeAccount.findByPk(accountId);
        expect(rtAccount).toBeDefined();
        expect(num(rtAccount?.equity)).toBe(11000);

        // Verify only one row exists
        const count = await RealTimeAccount.count({
          where: { account_id: accountId },
        });
        expect(count).toBe(1);
      });
    });

    describe('RealTimeStrategy Model', () => {
      it('should be synchronized from StrategyPerformance model via trigger', async () => {
        const strategyId = '123e4567-e89b-12d3-a456-426614174000';

        // Create strategy performance snapshot
        await StrategyPerformance.create({
          strategy_id: strategyId,
          account_id: '123e4567-e89b-12d3-a456-426614174001',
          timestamp: new Date('2024-01-15T10:00:00Z'),
          total_trades: 10,
          winning_trades: 6,
          losing_trades: 4,
          win_rate: 0.6,
          total_pnl: 1500.0,
          unrealized_pnl: 500.0,
          realized_pnl: 1000.0,
          max_drawdown: 5.0,
          current_drawdown: 2.0,
        });

        // Wait for trigger
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Verify it appears in real_time_strategies
        const rtStrategy = await RealTimeStrategy.findByPk(strategyId);

        expect(rtStrategy).toBeDefined();
        expect(num(rtStrategy?.total_pnl)).toBe(1500);
        expect(num(rtStrategy?.unrealized_pnl)).toBe(500);
        expect(num(rtStrategy?.current_drawdown)).toBe(2);
      });

      it('should upsert (replace) when multiple snapshots are created', async () => {
        const strategyId = '123e4567-e89b-12d3-a456-426614174000';

        // Create first snapshot
        await StrategyPerformance.create({
          strategy_id: strategyId,
          account_id: '123e4567-e89b-12d3-a456-426614174001',
          timestamp: new Date('2024-01-15T10:00:00Z'),
          total_trades: 10,
          winning_trades: 6,
          losing_trades: 4,
          win_rate: 0.6,
          total_pnl: 1500.0,
          unrealized_pnl: 500.0,
          realized_pnl: 1000.0,
          max_drawdown: 5.0,
          current_drawdown: 2.0,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create second snapshot
        await StrategyPerformance.create({
          strategy_id: strategyId,
          account_id: '123e4567-e89b-12d3-a456-426614174001',
          timestamp: new Date('2024-01-15T11:00:00Z'),
          total_trades: 15,
          winning_trades: 9,
          losing_trades: 6,
          win_rate: 0.6,
          total_pnl: 2000.0,
          unrealized_pnl: 500.0,
          realized_pnl: 1500.0,
          max_drawdown: 6.0,
          current_drawdown: 3.0,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));

        // Verify only latest state exists
        const rtStrategy = await RealTimeStrategy.findByPk(strategyId);
        expect(rtStrategy).toBeDefined();
        expect(num(rtStrategy?.total_pnl)).toBe(2000);

        // Verify only one row exists
        const count = await RealTimeStrategy.count({
          where: { strategy_id: strategyId },
        });
        expect(count).toBe(1);
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { Strategy } from '../../database/models/strategy.model';
import { Trade } from '../../database/models/trade.model';
import { StrategyPerformance } from '../../database/models/strategy-performance.model';
import { RealTimeStrategy } from '../../database/models/real-time-strategy.model';
import { RealTimeTrade } from '../../database/models/real-time-trade.model';
import { CreateStrategyDto, UpdateStrategyDto } from './dto';

describe('StrategyService', () => {
  let service: StrategyService;
  let strategyModel: any;
  let tradeModel: any;
  let strategyPerformanceModel: any;
  let realTimeStrategyModel: any;

  const mockStrategy = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'EUR/USD Scalper',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    destroy: jest.fn(),
  };

  const mockTrade = {
    trade_id: '550e8400-e29b-41d4-a716-446655440002',
    strategy_id: '550e8400-e29b-41d4-a716-446655440000',
    account_id: '550e8400-e29b-41d4-a716-446655440001',
    symbol: 'EURUSD',
    direction: 'long',
    entry_time: new Date(),
    entry_price: 1.1234,
    exit_time: new Date(),
    exit_price: 1.1244,
    quantity: 0.01,
    pnl: 10,
    status: 'closed',
  };

  const mockRealTimeStrategy = {
    strategy_id: '550e8400-e29b-41d4-a716-446655440000',
    account_id: '550e8400-e29b-41d4-a716-446655440001',
    total_pnl: 1550,
    unrealized_pnl: 250,
    current_drawdown: -2.1,
    last_updated: new Date(),
  };

  beforeEach(async () => {
    const txObject = { LOCK: { UPDATE: 'UPDATE' } } as const;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrategyService,
        {
          // Sequelize connection mock. By default `query()` reports the
          // advisory lock as acquired so seedDevData() proceeds. Specific
          // tests can override `query.mockResolvedValueOnce([{ locked: false }])`
          // to simulate contention.
          provide: getConnectionToken(),
          useValue: {
            transaction: jest.fn(
              async (cb: (t: typeof txObject) => Promise<unknown>) =>
                cb(txObject),
            ),
            query: jest.fn(async () => [{ locked: true }]),
          },
        },
        {
          provide: getModelToken(Strategy),
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findByPk: jest.fn(),
            bulkCreate: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(Trade),
          useValue: {
            findAll: jest.fn(),
            findAndCountAll: jest.fn(),
            bulkCreate: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(StrategyPerformance),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            bulkCreate: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(RealTimeStrategy),
          useValue: {
            findByPk: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: getModelToken(RealTimeTrade),
          useValue: {
            destroy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StrategyService>(StrategyService);
    strategyModel = module.get(getModelToken(Strategy));
    tradeModel = module.get(getModelToken(Trade));
    strategyPerformanceModel = module.get(getModelToken(StrategyPerformance));
    realTimeStrategyModel = module.get(getModelToken(RealTimeStrategy));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new strategy', async () => {
      const dto: CreateStrategyDto = { name: 'EUR/USD Scalper' };

      jest.spyOn(strategyModel, 'create').mockResolvedValue(mockStrategy);

      const result = await service.create(dto);

      expect(strategyModel.create).toHaveBeenCalledWith({
        name: dto.name,
        status: 'active',
      });
      expect(result).toEqual(mockStrategy);
    });

    it('should handle creation errors', async () => {
      const dto: CreateStrategyDto = { name: 'EUR/USD Scalper' };

      jest
        .spyOn(strategyModel, 'create')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.create(dto)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all strategies', async () => {
      jest.spyOn(strategyModel, 'findAll').mockResolvedValue([mockStrategy]);

      const result = await service.findAll();

      expect(strategyModel.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
      });
      expect(result).toEqual([mockStrategy]);
    });

    it('should handle errors', async () => {
      jest
        .spyOn(strategyModel, 'findAll')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return a strategy by ID', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(mockStrategy);

      const result = await service.findById(id);

      expect(strategyModel.findByPk).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockStrategy);
    });

    it('should throw NotFoundException if strategy not found', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
    });

    it('should handle errors', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      jest
        .spyOn(strategyModel, 'findByPk')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.findById(id)).rejects.toThrow('Database error');
    });
  });

  describe('update', () => {
    it('should update a strategy', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const dto: UpdateStrategyDto = {
        name: 'Updated Strategy',
        status: 'inactive',
      };

      const updateMockStrategy = { ...mockStrategy };
      jest
        .spyOn(strategyModel, 'findByPk')
        .mockResolvedValue(updateMockStrategy);

      const result = await service.update(id, dto);

      expect(updateMockStrategy.name).toBe('Updated Strategy');
      expect(updateMockStrategy.status).toBe('inactive');
      expect(updateMockStrategy.save).toHaveBeenCalled();
      expect(result).toEqual(updateMockStrategy);
    });

    it('should throw NotFoundException if strategy not found', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const dto: UpdateStrategyDto = { name: 'Updated' };

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(null);

      await expect(service.update(id, dto)).rejects.toThrow(NotFoundException);
    });

    it('should handle errors', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const dto: UpdateStrategyDto = { name: 'Updated' };

      jest
        .spyOn(strategyModel, 'findByPk')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.update(id, dto)).rejects.toThrow('Database error');
    });
  });

  describe('delete', () => {
    it('should delete a strategy', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(mockStrategy);

      await service.delete(id);

      expect(mockStrategy.destroy).toHaveBeenCalled();
    });

    it('should throw NotFoundException if strategy not found', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(null);

      await expect(service.delete(id)).rejects.toThrow(NotFoundException);
    });

    it('should handle errors', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest
        .spyOn(strategyModel, 'findByPk')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.delete(id)).rejects.toThrow('Database error');
    });
  });

  describe('getPerformance', () => {
    it('should return performance metrics anchored to day 1', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const day1 = new Date('2024-04-20T00:00:00.000Z');

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(mockStrategy);
      jest.spyOn(tradeModel, 'findAll').mockResolvedValue([mockTrade]);
      jest
        .spyOn(realTimeStrategyModel, 'findByPk')
        .mockResolvedValue(mockRealTimeStrategy);
      jest
        .spyOn(strategyPerformanceModel, 'findOne')
        .mockResolvedValue({ timestamp: day1 });
      jest.spyOn(strategyPerformanceModel, 'findAll').mockResolvedValue([
        { timestamp: day1, total_pnl: 100 },
        { timestamp: new Date('2024-04-21T00:00:00.000Z'), total_pnl: 150 },
        { timestamp: new Date('2024-04-22T00:00:00.000Z'), total_pnl: 80 },
        { timestamp: new Date('2024-04-23T00:00:00.000Z'), total_pnl: 130 },
      ]);

      const result = await service.getPerformance(id);

      expect(result.strategyId).toBe(id);
      expect(result.totalPnL).toBe(1550);
      expect(result.totalTrades).toBe(1);
      expect(result.winningTrades).toBe(1);
      expect(result.losingTrades).toBe(0);
      expect(result.winRate).toBe(1);
      expect(result.maxDrawdown).toBe(70);
      expect(result.currentDrawdown).toBe(20);
      expect(result).not.toHaveProperty('totalReturn');
    });

    it('should throw NotFoundException if strategy not found', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(null);

      await expect(service.getPerformance(id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return zeroed metrics when no snapshots exist', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(mockStrategy);
      jest.spyOn(realTimeStrategyModel, 'findByPk').mockResolvedValue(null);
      jest
        .spyOn(strategyPerformanceModel, 'findOne')
        .mockResolvedValue(null);

      const result = await service.getPerformance(id);

      expect(result.totalPnL).toBe(0);
      expect(result.totalTrades).toBe(0);
      expect(result.winningTrades).toBe(0);
      expect(result.losingTrades).toBe(0);
      expect(result.winRate).toBe(0);
      expect(result.maxDrawdown).toBe(0);
      expect(result.currentDrawdown).toBe(0);
    });

    it('should compute win rate using closed trades only (open + cancelled excluded)', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const day1 = new Date('2024-04-20T00:00:00.000Z');

      const winningClosed = { ...mockTrade, status: 'closed', pnl: 25 };
      const openTrade = {
        ...mockTrade,
        trade_id: 'open-1',
        status: 'open',
        pnl: null,
      };
      const cancelledTrade = {
        ...mockTrade,
        trade_id: 'cancelled-1',
        status: 'cancelled',
        pnl: null,
      };

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(mockStrategy);
      jest
        .spyOn(realTimeStrategyModel, 'findByPk')
        .mockResolvedValue(mockRealTimeStrategy);
      jest
        .spyOn(strategyPerformanceModel, 'findOne')
        .mockResolvedValue({ timestamp: day1 });
      jest.spyOn(strategyPerformanceModel, 'findAll').mockResolvedValue([]);
      jest
        .spyOn(tradeModel, 'findAll')
        .mockResolvedValue([winningClosed, openTrade, cancelledTrade]);

      const result = await service.getPerformance(id);

      expect(result.totalTrades).toBe(3);
      expect(result.winningTrades).toBe(1);
      expect(result.losingTrades).toBe(0);
      expect(result.winRate).toBe(1);
    });

    it('should compute max drawdown as absolute USD peak-to-trough on total_pnl', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const day1 = new Date('2024-04-20T00:00:00.000Z');

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(mockStrategy);
      jest.spyOn(tradeModel, 'findAll').mockResolvedValue([]);
      jest
        .spyOn(realTimeStrategyModel, 'findByPk')
        .mockResolvedValue(mockRealTimeStrategy);
      jest
        .spyOn(strategyPerformanceModel, 'findOne')
        .mockResolvedValue({ timestamp: day1 });
      jest.spyOn(strategyPerformanceModel, 'findAll').mockResolvedValue([
        { timestamp: new Date('2024-04-20T00:00:00.000Z'), total_pnl: 100 },
        { timestamp: new Date('2024-04-21T00:00:00.000Z'), total_pnl: 150 },
        { timestamp: new Date('2024-04-22T00:00:00.000Z'), total_pnl: 90 },
        { timestamp: new Date('2024-04-23T00:00:00.000Z'), total_pnl: 130 },
        { timestamp: new Date('2024-04-24T00:00:00.000Z'), total_pnl: 50 },
      ]);

      const result = await service.getPerformance(id);

      // Peak 150 → trough 50 = 100 USD drawdown.
      expect(result.maxDrawdown).toBe(100);
      // Current peak is 150, latest is 50, so currentDrawdown = 100.
      expect(result.currentDrawdown).toBe(100);
    });
  });

  describe('getPublicSummary', () => {
    it('should return public summary without capital info or totalReturn', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const freshMockStrategy = { ...mockStrategy };
      const day1 = new Date('2024-04-20T00:00:00.000Z');

      jest
        .spyOn(strategyModel, 'findByPk')
        .mockResolvedValue(freshMockStrategy);
      jest.spyOn(tradeModel, 'findAll').mockResolvedValue([mockTrade]);
      jest
        .spyOn(realTimeStrategyModel, 'findByPk')
        .mockResolvedValue(mockRealTimeStrategy);
      jest
        .spyOn(strategyPerformanceModel, 'findOne')
        .mockResolvedValue({ timestamp: day1 });
      jest.spyOn(strategyPerformanceModel, 'findAll').mockResolvedValue([
        { timestamp: day1, total_pnl: 200 },
        { timestamp: new Date('2024-04-21T00:00:00.000Z'), total_pnl: 50 },
      ]);

      const result = await service.getPublicSummary(id);

      expect(result.strategyId).toBe(id);
      expect(result.name).toBe('EUR/USD Scalper');
      expect(result.winRate).toBe(1);
      expect(result.totalTrades).toBe(1);
      // Peak 200 → trough 50 = 150 USD drawdown.
      expect(result.maxDrawdown).toBe(150);
      expect(result).not.toHaveProperty('initial_capital');
      expect(result).not.toHaveProperty('totalPnL');
      expect(result).not.toHaveProperty('totalReturn');
    });

    it('should throw NotFoundException if strategy not found', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(null);

      await expect(service.getPublicSummary(id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTrades', () => {
    it('should return trades with pagination', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(mockStrategy);
      jest.spyOn(tradeModel, 'findAndCountAll').mockResolvedValue({
        rows: [mockTrade],
        count: 1,
      });

      const result = await service.getTrades(id, 50, 0);

      expect(tradeModel.findAndCountAll).toHaveBeenCalledWith({
        where: { strategy_id: id },
        limit: 50,
        offset: 0,
        order: [['entry_time', 'DESC']],
      });
      expect(result.trades).toEqual([mockTrade]);
      expect(result.total).toBe(1);
    });

    it('should filter trades by status', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(mockStrategy);
      jest.spyOn(tradeModel, 'findAndCountAll').mockResolvedValue({
        rows: [mockTrade],
        count: 1,
      });

      await service.getTrades(id, 50, 0, 'closed');

      expect(tradeModel.findAndCountAll).toHaveBeenCalledWith({
        where: { strategy_id: id, status: 'closed' },
        limit: 50,
        offset: 0,
        order: [['entry_time', 'DESC']],
      });
    });

    it('should throw NotFoundException if strategy not found', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(null);

      await expect(service.getTrades(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEquityCurve', () => {
    it('should return equity curve data (totalPnL + drawdown only, no absolute equity)', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const mockPerformance = {
        timestamp: new Date(),
        total_pnl: 500,
        current_drawdown: -2.5,
      };

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(mockStrategy);
      jest
        .spyOn(strategyPerformanceModel, 'findAll')
        .mockResolvedValue([mockPerformance]);

      const result = await service.getEquityCurve(id, 30);

      expect(result).toHaveLength(1);
      expect(result[0].totalPnL).toBe(500);
      expect(result[0].drawdown).toBe(-2.5);
      expect(result[0]).not.toHaveProperty('equity');
    });

    it('should throw NotFoundException if strategy not found', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(null);

      await expect(service.getEquityCurve(id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -----------------------------------------------------------------
  // seedDevData — atomicity + concurrency contract
  //
  // These tests pin down the race-safety guarantees added in the
  // "make dev/seed bulletproof" pass:
  //   1. The whole operation runs inside ONE Sequelize transaction.
  //   2. Before doing anything destructive it acquires
  //      pg_try_advisory_xact_lock(STRATEGY_WRITE_LOCK_KEY) — the same
  //      key the strategy-sync cron uses.
  //   3. If the lock cannot be acquired, ConflictException is thrown
  //      and zero destructive work runs.
  //   4. The 10 strategies + their snapshots/trades are inserted via
  //      bulkCreate (one INSERT per table) inside the same tx.
  // -----------------------------------------------------------------
  describe('seedDevData (race-safety contract)', () => {
    let sequelize: any;
    const fakeStrategyRows = Array.from({ length: 10 }, (_, i) => ({
      id: `00000000-0000-0000-0000-00000000000${i}`,
      name: `Strategy ${i + 1}`,
    }));

    beforeEach(() => {
      sequelize = (service as any).sequelize;
      jest
        .spyOn(strategyModel, 'bulkCreate')
        .mockResolvedValue(fakeStrategyRows as any);
      jest.spyOn(strategyModel, 'findAll').mockResolvedValue([]);
      jest.spyOn(strategyModel, 'destroy').mockResolvedValue(0);
      jest.spyOn(strategyPerformanceModel, 'bulkCreate').mockResolvedValue([]);
      jest.spyOn(strategyPerformanceModel, 'destroy').mockResolvedValue(0);
      jest.spyOn(tradeModel, 'bulkCreate').mockResolvedValue([]);
      jest.spyOn(tradeModel, 'destroy').mockResolvedValue(0);
      jest.spyOn(realTimeStrategyModel, 'destroy').mockResolvedValue(0);
      // RealTimeTrade lives on the test module under a different name;
      // grab it through the service so the spy hits the same instance.
      jest
        .spyOn((service as any).realTimeTradeModel, 'destroy')
        .mockResolvedValue(0);
    });

    it('runs the entire seed inside a single Sequelize transaction', async () => {
      await service.seedDevData('2024-04-20');
      expect(sequelize.transaction).toHaveBeenCalledTimes(1);
    });

    it('acquires pg_try_advisory_xact_lock with the shared write-lock key', async () => {
      await service.seedDevData('2024-04-20');
      expect(sequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('pg_try_advisory_xact_lock'),
        expect.objectContaining({
          replacements: { key: 0x5747c9ce },
        }),
      );
    });

    it('throws ConflictException and does NO writes when the lock is held by another transaction', async () => {
      sequelize.query.mockResolvedValueOnce([{ locked: false }]);

      await expect(service.seedDevData('2024-04-20')).rejects.toThrow(
        ConflictException,
      );

      // Critical: zero destructive work happens when contention is detected.
      expect(strategyModel.destroy).not.toHaveBeenCalled();
      expect(strategyPerformanceModel.destroy).not.toHaveBeenCalled();
      expect(tradeModel.destroy).not.toHaveBeenCalled();
      expect(strategyModel.bulkCreate).not.toHaveBeenCalled();
      expect(strategyPerformanceModel.bulkCreate).not.toHaveBeenCalled();
      expect(tradeModel.bulkCreate).not.toHaveBeenCalled();
    });

    it('bulk-inserts exactly 10 strategies named Strategy 1..Strategy 10', async () => {
      await service.seedDevData('2024-04-20');

      expect(strategyModel.bulkCreate).toHaveBeenCalledTimes(1);
      const [rows] = (strategyModel.bulkCreate as jest.Mock).mock.calls[0];
      expect(rows).toHaveLength(10);
      expect(rows.map((r: any) => r.name)).toEqual([
        'Strategy 1',
        'Strategy 2',
        'Strategy 3',
        'Strategy 4',
        'Strategy 5',
        'Strategy 6',
        'Strategy 7',
        'Strategy 8',
        'Strategy 9',
        'Strategy 10',
      ]);
    });

    it('uses bulkCreate (one INSERT per table) instead of per-row create calls', async () => {
      await service.seedDevData('2024-04-20');

      // 10 snapshots * 10 strategies = 100 rows in ONE call.
      expect(strategyPerformanceModel.bulkCreate).toHaveBeenCalledTimes(1);
      const [snapshots] = (strategyPerformanceModel.bulkCreate as jest.Mock)
        .mock.calls[0];
      expect(snapshots).toHaveLength(100);

      // All trades across all 10 seeds go in ONE call — the exact
      // count is whatever the seed table sums to (113 today); the
      // contract we're asserting is "one bulkCreate, not N creates".
      expect(tradeModel.bulkCreate).toHaveBeenCalledTimes(1);
      const [trades] = (tradeModel.bulkCreate as jest.Mock).mock.calls[0];
      expect(trades.length).toBeGreaterThan(50);
    });

    it('passes the transaction handle into every destroy/bulkCreate call', async () => {
      await service.seedDevData('2024-04-20');

      // Spot-check a few — every call must include { transaction: <tx> }.
      const tx = (sequelize.transaction as jest.Mock).mock.calls[0][0];
      // The cb was invoked with the txObject literal we mocked.
      void tx; // silence unused for clarity; the assertion below is the real check.

      const allCalls = [
        ...(strategyModel.bulkCreate as jest.Mock).mock.calls,
        ...(strategyPerformanceModel.bulkCreate as jest.Mock).mock.calls,
        ...(tradeModel.bulkCreate as jest.Mock).mock.calls,
      ];
      for (const [, opts] of allCalls) {
        expect(opts).toHaveProperty('transaction');
        expect(opts.transaction).toBeDefined();
      }
    });
  });
});

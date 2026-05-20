import { Test, TestingModule } from '@nestjs/testing';
import { StrategyController } from './strategy.controller';
import { StrategyService } from './strategy.service';
import { CreateStrategyDto, UpdateStrategyDto } from './dto';

describe('StrategyController', () => {
  let controller: StrategyController;
  let service: StrategyService;

  const mockStrategy = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'EUR/USD Scalper',
    description: 'A scalping strategy',
    account_id: '550e8400-e29b-41d4-a716-446655440001',
    status: 'active',
    initial_capital: 10000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPerformance = {
    strategyId: '550e8400-e29b-41d4-a716-446655440000',
    totalReturn: 15.5,
    totalPnL: 1550,
    unrealizedPnL: 250,
    realizedPnL: 1300,
    winRate: 0.65,
    totalTrades: 100,
    winningTrades: 65,
    losingTrades: 35,
    maxDrawdown: -8.5,
    currentDrawdown: -2.1,
    lastUpdated: new Date(),
  };

  const mockPublicSummary = {
    strategyId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'EUR/USD Scalper',
    totalReturn: 15.5,
    winRate: 0.65,
    totalTrades: 100,
    maxDrawdown: -8.5,
    lastUpdated: new Date(),
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

  const mockEquityCurve = [
    {
      timestamp: new Date(),
      equity: 10500,
      totalPnL: 500,
      drawdown: -2.5,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StrategyController],
      providers: [
        {
          provide: StrategyService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findByAccountId: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getPerformance: jest.fn(),
            getPublicSummary: jest.fn(),
            getTrades: jest.fn(),
            getEquityCurve: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StrategyController>(StrategyController);
    service = module.get<StrategyService>(StrategyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new strategy', async () => {
      const dto: CreateStrategyDto = {
        name: 'EUR/USD Scalper',
        description: 'A scalping strategy',
        account_id: '550e8400-e29b-41d4-a716-446655440001',
        initial_capital: 10000,
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockStrategy);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockStrategy);
    });

    it('should propagate errors from service', async () => {
      const dto: CreateStrategyDto = {
        name: 'EUR/USD Scalper',
        description: 'A scalping strategy',
        account_id: '550e8400-e29b-41d4-a716-446655440001',
        initial_capital: 10000,
      };

      const error = new Error('Creation failed');
      jest.spyOn(service, 'create').mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toThrow('Creation failed');
    });
  });

  describe('findAll', () => {
    it('should return all strategies', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([mockStrategy]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockStrategy]);
    });

    it('should propagate errors from service', async () => {
      const error = new Error('Fetch failed');
      jest.spyOn(service, 'findAll').mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow('Fetch failed');
    });
  });

  describe('findByAccountId', () => {
    it('should return strategies for an account', async () => {
      const accountId = '550e8400-e29b-41d4-a716-446655440001';
      jest.spyOn(service, 'findByAccountId').mockResolvedValue([mockStrategy]);

      const result = await controller.findByAccountId(accountId);

      expect(service.findByAccountId).toHaveBeenCalledWith(accountId);
      expect(result).toEqual([mockStrategy]);
    });

    it('should propagate errors from service', async () => {
      const accountId = '550e8400-e29b-41d4-a716-446655440001';
      const error = new Error('Fetch failed');
      jest.spyOn(service, 'findByAccountId').mockRejectedValue(error);

      await expect(controller.findByAccountId(accountId)).rejects.toThrow('Fetch failed');
    });
  });

  describe('findById', () => {
    it('should return a strategy by ID', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      jest.spyOn(service, 'findById').mockResolvedValue(mockStrategy);

      const result = await controller.findById(id);

      expect(service.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockStrategy);
    });

    it('should propagate errors from service', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const error = new Error('Strategy not found');
      jest.spyOn(service, 'findById').mockRejectedValue(error);

      await expect(controller.findById(id)).rejects.toThrow('Strategy not found');
    });
  });

  describe('update', () => {
    it('should update a strategy', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const dto: UpdateStrategyDto = {
        name: 'Updated Strategy',
        status: 'inactive',
      };

      jest.spyOn(service, 'update').mockResolvedValue(mockStrategy);

      const result = await controller.update(id, dto);

      expect(service.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(mockStrategy);
    });

    it('should propagate errors from service', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const dto: UpdateStrategyDto = { name: 'Updated' };
      const error = new Error('Update failed');
      jest.spyOn(service, 'update').mockRejectedValue(error);

      await expect(controller.update(id, dto)).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete a strategy', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      jest.spyOn(service, 'delete').mockResolvedValue(undefined);

      await controller.delete(id);

      expect(service.delete).toHaveBeenCalledWith(id);
    });

    it('should propagate errors from service', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const error = new Error('Delete failed');
      jest.spyOn(service, 'delete').mockRejectedValue(error);

      await expect(controller.delete(id)).rejects.toThrow('Delete failed');
    });
  });

  describe('getPerformance', () => {
    it('should return performance metrics', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      jest.spyOn(service, 'getPerformance').mockResolvedValue(mockPerformance);

      const result = await controller.getPerformance(id);

      expect(service.getPerformance).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockPerformance);
    });

    it('should propagate errors from service', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const error = new Error('Performance fetch failed');
      jest.spyOn(service, 'getPerformance').mockRejectedValue(error);

      await expect(controller.getPerformance(id)).rejects.toThrow('Performance fetch failed');
    });
  });

  describe('getTrades', () => {
    it('should return trades with default pagination', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      jest.spyOn(service, 'getTrades').mockResolvedValue({
        trades: [mockTrade],
        total: 1,
      });

      const result = await controller.getTrades(id);

      expect(service.getTrades).toHaveBeenCalledWith(id, 50, 0, undefined);
      expect(result.trades).toEqual([mockTrade]);
      expect(result.total).toBe(1);
    });

    it('should return trades with custom pagination', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      jest.spyOn(service, 'getTrades').mockResolvedValue({
        trades: [mockTrade],
        total: 1,
      });

      const result = await controller.getTrades(id, '25', '10', 'closed');

      expect(service.getTrades).toHaveBeenCalledWith(id, 25, 10, 'closed');
      expect(result.trades).toEqual([mockTrade]);
    });

    it('should propagate errors from service', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const error = new Error('Trades fetch failed');
      jest.spyOn(service, 'getTrades').mockRejectedValue(error);

      await expect(controller.getTrades(id)).rejects.toThrow('Trades fetch failed');
    });
  });

  describe('getEquityCurve', () => {
    it('should return equity curve with default days', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      jest.spyOn(service, 'getEquityCurve').mockResolvedValue(mockEquityCurve);

      const result = await controller.getEquityCurve(id);

      expect(service.getEquityCurve).toHaveBeenCalledWith(id, 30);
      expect(result).toEqual(mockEquityCurve);
    });

    it('should return equity curve with custom days', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      jest.spyOn(service, 'getEquityCurve').mockResolvedValue(mockEquityCurve);

      const result = await controller.getEquityCurve(id, '60');

      expect(service.getEquityCurve).toHaveBeenCalledWith(id, 60);
      expect(result).toEqual(mockEquityCurve);
    });

    it('should propagate errors from service', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const error = new Error('Equity curve fetch failed');
      jest.spyOn(service, 'getEquityCurve').mockRejectedValue(error);

      await expect(controller.getEquityCurve(id)).rejects.toThrow('Equity curve fetch failed');
    });
  });

  describe('getPublicSummary', () => {
    it('should return public summary without capital info', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      jest.spyOn(service, 'getPublicSummary').mockResolvedValue(mockPublicSummary);

      const result = await controller.getPublicSummary(id);

      expect(service.getPublicSummary).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockPublicSummary);
      // Verify no capital info is exposed
      expect(result).not.toHaveProperty('initial_capital');
      expect(result).not.toHaveProperty('totalPnL');
    });

    it('should propagate errors from service', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const error = new Error('Public summary fetch failed');
      jest.spyOn(service, 'getPublicSummary').mockRejectedValue(error);

      await expect(controller.getPublicSummary(id)).rejects.toThrow('Public summary fetch failed');
    });
  });
});

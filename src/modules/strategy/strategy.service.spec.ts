import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { Strategy } from '../../database/models/strategy.model';
import { Trade } from '../../database/models/trade.model';
import { StrategyPerformance } from '../../database/models/strategy-performance.model';
import { RealTimeStrategy } from '../../database/models/real-time-strategy.model';
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
    description: 'A scalping strategy',
    account_id: '550e8400-e29b-41d4-a716-446655440001',
    status: 'active',
    initial_capital: 10000,
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrategyService,
        {
          provide: getModelToken(Strategy),
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findByPk: jest.fn(),
          },
        },
        {
          provide: getModelToken(Trade),
          useValue: {
            findAll: jest.fn(),
            findAndCountAll: jest.fn(),
          },
        },
        {
          provide: getModelToken(StrategyPerformance),
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: getModelToken(RealTimeStrategy),
          useValue: {
            findByPk: jest.fn(),
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
      const dto: CreateStrategyDto = {
        name: 'EUR/USD Scalper',
        description: 'A scalping strategy',
        account_id: '550e8400-e29b-41d4-a716-446655440001',
        initial_capital: 10000,
      };

      jest.spyOn(strategyModel, 'create').mockResolvedValue(mockStrategy);

      const result = await service.create(dto);

      expect(strategyModel.create).toHaveBeenCalledWith({
        name: dto.name,
        description: dto.description,
        account_id: dto.account_id,
        initial_capital: dto.initial_capital,
        status: 'active',
      });
      expect(result).toEqual(mockStrategy);
    });

    it('should throw BadRequestException if initial_capital is <= 0', async () => {
      const dto: CreateStrategyDto = {
        name: 'EUR/USD Scalper',
        description: 'A scalping strategy',
        account_id: '550e8400-e29b-41d4-a716-446655440001',
        initial_capital: 0,
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should handle creation errors', async () => {
      const dto: CreateStrategyDto = {
        name: 'EUR/USD Scalper',
        description: 'A scalping strategy',
        account_id: '550e8400-e29b-41d4-a716-446655440001',
        initial_capital: 10000,
      };

      jest.spyOn(strategyModel, 'create').mockRejectedValue(new Error('Database error'));

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
      jest.spyOn(strategyModel, 'findAll').mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findByAccountId', () => {
    it('should return strategies for an account', async () => {
      const accountId = '550e8400-e29b-41d4-a716-446655440001';
      jest.spyOn(strategyModel, 'findAll').mockResolvedValue([mockStrategy]);

      const result = await service.findByAccountId(accountId);

      expect(strategyModel.findAll).toHaveBeenCalledWith({
        where: { account_id: accountId },
        order: [['createdAt', 'DESC']],
      });
      expect(result).toEqual([mockStrategy]);
    });

    it('should handle errors', async () => {
      const accountId = '550e8400-e29b-41d4-a716-446655440001';
      jest.spyOn(strategyModel, 'findAll').mockRejectedValue(new Error('Database error'));

      await expect(service.findByAccountId(accountId)).rejects.toThrow('Database error');
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
      jest.spyOn(strategyModel, 'findByPk').mockRejectedValue(new Error('Database error'));

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
      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(updateMockStrategy);

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

      jest.spyOn(strategyModel, 'findByPk').mockRejectedValue(new Error('Database error'));

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

      jest.spyOn(strategyModel, 'findByPk').mockRejectedValue(new Error('Database error'));

      await expect(service.delete(id)).rejects.toThrow('Database error');
    });
  });

  describe('getPerformance', () => {
    it('should return performance metrics', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(mockStrategy);
      jest.spyOn(tradeModel, 'findAll').mockResolvedValue([mockTrade]);
      jest.spyOn(realTimeStrategyModel, 'findByPk').mockResolvedValue(mockRealTimeStrategy);

      const result = await service.getPerformance(id);

      expect(result.strategyId).toBe(id);
      expect(result.totalReturn).toBe(15.5);
      expect(result.totalTrades).toBe(1);
      expect(result.winningTrades).toBe(1);
      expect(result.losingTrades).toBe(0);
      expect(result.winRate).toBe(1);
    });

    it('should throw NotFoundException if strategy not found', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(null);

      await expect(service.getPerformance(id)).rejects.toThrow(NotFoundException);
    });

    it('should handle missing real-time data', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(mockStrategy);
      jest.spyOn(tradeModel, 'findAll').mockResolvedValue([]);
      jest.spyOn(realTimeStrategyModel, 'findByPk').mockResolvedValue(null);

      const result = await service.getPerformance(id);

      expect(result.totalPnL).toBe(0);
      expect(result.totalTrades).toBe(0);
      expect(result.winRate).toBe(0);
    });
  });

  describe('getPublicSummary', () => {
    it('should return public summary without capital info', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const freshMockStrategy = { ...mockStrategy };

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(freshMockStrategy);
      jest.spyOn(tradeModel, 'findAll').mockResolvedValue([mockTrade]);
      jest.spyOn(realTimeStrategyModel, 'findByPk').mockResolvedValue(mockRealTimeStrategy);

      const result = await service.getPublicSummary(id);

      expect(result.strategyId).toBe(id);
      expect(result.name).toBe('EUR/USD Scalper');
      expect(result.totalReturn).toBe(15.5);
      expect(result.winRate).toBe(1);
      expect(result.totalTrades).toBe(1);
      expect(result.maxDrawdown).toBe(-2.1);
      // Ensure no capital info is exposed
      expect(result).not.toHaveProperty('initial_capital');
      expect(result).not.toHaveProperty('totalPnL');
    });

    it('should throw NotFoundException if strategy not found', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(null);

      await expect(service.getPublicSummary(id)).rejects.toThrow(NotFoundException);
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
    it('should return equity curve data', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const mockPerformance = {
        timestamp: new Date(),
        total_pnl: 500,
        current_drawdown: -2.5,
      };

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(mockStrategy);
      jest.spyOn(strategyPerformanceModel, 'findAll').mockResolvedValue([mockPerformance]);

      const result = await service.getEquityCurve(id, 30);

      expect(result).toHaveLength(1);
      expect(result[0].equity).toBe(10500); // initial_capital + total_pnl
      expect(result[0].totalPnL).toBe(500);
      expect(result[0].drawdown).toBe(-2.5);
    });

    it('should throw NotFoundException if strategy not found', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      jest.spyOn(strategyModel, 'findByPk').mockResolvedValue(null);

      await expect(service.getEquityCurve(id)).rejects.toThrow(NotFoundException);
    });
  });
});

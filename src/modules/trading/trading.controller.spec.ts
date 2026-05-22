import { Test, TestingModule } from '@nestjs/testing';
import { TradingController } from './trading.controller';
import { TradingService } from './trading.service';
import {
  TradeDto,
  TimeRangeQueryDto,
  CandlesQueryDto,
  MarginQueryDto,
} from './dto';

describe('TradingController', () => {
  let controller: TradingController;
  let service: TradingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TradingController],
      providers: [
        {
          provide: TradingService,
          useValue: {
            getAccountInformation: jest.fn(),
            getPositions: jest.fn(),
            getPosition: jest.fn(),
            getOrders: jest.fn(),
            getOrder: jest.fn(),
            getHistoryOrdersByTime: jest.fn(),
            getHistoryOrdersByTicket: jest.fn(),
            getHistoryDealsByTime: jest.fn(),
            getHistoryDealsByTicket: jest.fn(),
            getSymbols: jest.fn(),
            getSymbolSpec: jest.fn(),
            getCurrentPrice: jest.fn(),
            getCandles: jest.fn(),
            getTicks: jest.fn(),
            getOrderBook: jest.fn(),
            executeTrade: jest.fn(),
            getServerTime: jest.fn(),
            calculateMargin: jest.fn(),
            getCpuCredits: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TradingController>(TradingController);
    service = module.get<TradingService>(TradingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have TradingService injected', () => {
    expect(service).toBeDefined();
  });

  // ==================== Account Information Endpoints ====================

  describe('getAccountInformation', () => {
    it('should call tradingService.getAccountInformation with accountId', async () => {
      const accountId = 'test-account-123';
      const mockAccountInfo = {
        balance: 10000,
        equity: 10500,
        margin: 500,
        freeMargin: 10000,
        marginLevel: 2100,
        currency: 'USD',
        leverage: 100,
      };

      jest
        .spyOn(service, 'getAccountInformation')
        .mockResolvedValue(mockAccountInfo);

      const result = await controller.getAccountInformation(accountId);

      expect(service.getAccountInformation).toHaveBeenCalledWith(accountId);
      expect(service.getAccountInformation).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccountInfo);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const error = new Error('Account not found');
      jest.spyOn(service, 'getAccountInformation').mockRejectedValue(error);

      await expect(controller.getAccountInformation(accountId)).rejects.toThrow(
        'Account not found',
      );
    });
  });

  describe('getServerTime', () => {
    it('should call tradingService.getServerTime with accountId', async () => {
      const accountId = 'test-account-123';
      const mockServerTime = {
        time: '2024-01-15T10:30:00.000Z',
        brokerTime: '2024-01-15T12:30:00.000Z',
      };

      jest.spyOn(service, 'getServerTime').mockResolvedValue(mockServerTime);

      const result = await controller.getServerTime(accountId);

      expect(service.getServerTime).toHaveBeenCalledWith(accountId);
      expect(service.getServerTime).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServerTime);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const error = new Error('Failed to get server time');
      jest.spyOn(service, 'getServerTime').mockRejectedValue(error);

      await expect(controller.getServerTime(accountId)).rejects.toThrow(
        'Failed to get server time',
      );
    });
  });

  describe('getCpuCredits', () => {
    it('should call tradingService.getCpuCredits with accountId', async () => {
      const accountId = 'test-account-123';
      const mockCpuCredits = { cpuCredits: 1000 };

      jest.spyOn(service, 'getCpuCredits').mockResolvedValue(mockCpuCredits);

      const result = await controller.getCpuCredits(accountId);

      expect(service.getCpuCredits).toHaveBeenCalledWith(accountId);
      expect(service.getCpuCredits).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCpuCredits);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const error = new Error('Failed to get CPU credits');
      jest.spyOn(service, 'getCpuCredits').mockRejectedValue(error);

      await expect(controller.getCpuCredits(accountId)).rejects.toThrow(
        'Failed to get CPU credits',
      );
    });
  });

  // ==================== Position Endpoints ====================

  describe('getPositions', () => {
    it('should call tradingService.getPositions with accountId', async () => {
      const accountId = 'test-account-123';
      const mockPositions = [
        {
          id: 'pos1',
          symbol: 'EURUSD',
          type: 'POSITION_TYPE_BUY' as const,
          volume: 0.01,
          openPrice: 1.1234,
          currentPrice: 1.1244,
          profit: 10,
          swap: 0,
        },
      ];

      jest.spyOn(service, 'getPositions').mockResolvedValue(mockPositions);

      const result = await controller.getPositions(accountId);

      expect(service.getPositions).toHaveBeenCalledWith(accountId);
      expect(service.getPositions).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockPositions);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const error = new Error('Failed to get positions');
      jest.spyOn(service, 'getPositions').mockRejectedValue(error);

      await expect(controller.getPositions(accountId)).rejects.toThrow(
        'Failed to get positions',
      );
    });
  });

  describe('getPosition', () => {
    it('should call tradingService.getPosition with accountId and positionId', async () => {
      const accountId = 'test-account-123';
      const positionId = 'pos1';
      const mockPosition = {
        id: 'pos1',
        symbol: 'EURUSD',
        type: 'POSITION_TYPE_BUY' as const,
        volume: 0.01,
        openPrice: 1.1234,
        currentPrice: 1.1244,
        profit: 10,
        swap: 0,
      };

      jest.spyOn(service, 'getPosition').mockResolvedValue(mockPosition);

      const result = await controller.getPosition(accountId, positionId);

      expect(service.getPosition).toHaveBeenCalledWith(accountId, positionId);
      expect(service.getPosition).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockPosition);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const positionId = 'pos1';
      const error = new Error('Position not found');
      jest.spyOn(service, 'getPosition').mockRejectedValue(error);

      await expect(
        controller.getPosition(accountId, positionId),
      ).rejects.toThrow('Position not found');
    });
  });

  // ==================== Pending Order Endpoints ====================

  describe('getOrders', () => {
    it('should call tradingService.getOrders with accountId', async () => {
      const accountId = 'test-account-123';
      const mockOrders = [
        {
          id: 'ord1',
          symbol: 'EURUSD',
          type: 'ORDER_TYPE_BUY_LIMIT',
          volume: 0.01,
          openPrice: 1.12,
          currentPrice: 1.1234,
          state: 'ORDER_STATE_PLACED',
        },
      ];

      jest.spyOn(service, 'getOrders').mockResolvedValue(mockOrders);

      const result = await controller.getOrders(accountId);

      expect(service.getOrders).toHaveBeenCalledWith(accountId);
      expect(service.getOrders).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockOrders);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const error = new Error('Failed to get orders');
      jest.spyOn(service, 'getOrders').mockRejectedValue(error);

      await expect(controller.getOrders(accountId)).rejects.toThrow(
        'Failed to get orders',
      );
    });
  });

  describe('getOrder', () => {
    it('should call tradingService.getOrder with accountId and orderId', async () => {
      const accountId = 'test-account-123';
      const orderId = 'ord1';
      const mockOrder = {
        id: 'ord1',
        symbol: 'EURUSD',
        type: 'ORDER_TYPE_BUY_LIMIT',
        volume: 0.01,
        openPrice: 1.12,
        currentPrice: 1.1234,
        state: 'ORDER_STATE_PLACED',
      };

      jest.spyOn(service, 'getOrder').mockResolvedValue(mockOrder);

      const result = await controller.getOrder(accountId, orderId);

      expect(service.getOrder).toHaveBeenCalledWith(accountId, orderId);
      expect(service.getOrder).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockOrder);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const orderId = 'ord1';
      const error = new Error('Order not found');
      jest.spyOn(service, 'getOrder').mockRejectedValue(error);

      await expect(controller.getOrder(accountId, orderId)).rejects.toThrow(
        'Order not found',
      );
    });
  });

  // ==================== Historical Order Endpoints ====================

  describe('getHistoryOrdersByTime', () => {
    it('should call tradingService.getHistoryOrdersByTime with accountId and time range', async () => {
      const accountId = 'test-account-123';
      const query: TimeRangeQueryDto = {
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-31T23:59:59.999Z',
      };
      const mockOrders = [
        {
          id: 'hist1',
          symbol: 'EURUSD',
          type: 'ORDER_TYPE_BUY',
          volume: 0.01,
          openPrice: 1.1234,
          closePrice: 1.1244,
          state: 'ORDER_STATE_FILLED',
          doneTime: '2024-01-15T10:30:00.000Z',
        },
      ];

      jest
        .spyOn(service, 'getHistoryOrdersByTime')
        .mockResolvedValue(mockOrders);

      const result = await controller.getHistoryOrdersByTime(accountId, query);

      expect(service.getHistoryOrdersByTime).toHaveBeenCalledWith(
        accountId,
        new Date(query.startTime),
        new Date(query.endTime),
      );
      expect(service.getHistoryOrdersByTime).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockOrders);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const query: TimeRangeQueryDto = {
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-31T23:59:59.999Z',
      };
      const error = new Error('Failed to get history orders');
      jest.spyOn(service, 'getHistoryOrdersByTime').mockRejectedValue(error);

      await expect(
        controller.getHistoryOrdersByTime(accountId, query),
      ).rejects.toThrow('Failed to get history orders');
    });
  });

  describe('getHistoryOrdersByTicket', () => {
    it('should call tradingService.getHistoryOrdersByTicket with accountId and ticket', async () => {
      const accountId = 'test-account-123';
      const ticket = '12345678';
      const mockOrders = [
        {
          id: 'hist1',
          symbol: 'EURUSD',
          type: 'ORDER_TYPE_BUY',
          volume: 0.01,
          openPrice: 1.1234,
          closePrice: 1.1244,
          state: 'ORDER_STATE_FILLED',
          doneTime: '2024-01-15T10:30:00.000Z',
        },
      ];

      jest
        .spyOn(service, 'getHistoryOrdersByTicket')
        .mockResolvedValue(mockOrders);

      const result = await controller.getHistoryOrdersByTicket(
        accountId,
        ticket,
      );

      expect(service.getHistoryOrdersByTicket).toHaveBeenCalledWith(
        accountId,
        ticket,
      );
      expect(service.getHistoryOrdersByTicket).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockOrders);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const ticket = '12345678';
      const error = new Error('Failed to get history orders by ticket');
      jest.spyOn(service, 'getHistoryOrdersByTicket').mockRejectedValue(error);

      await expect(
        controller.getHistoryOrdersByTicket(accountId, ticket),
      ).rejects.toThrow('Failed to get history orders by ticket');
    });
  });

  // ==================== Deal History Endpoints ====================

  describe('getHistoryDealsByTime', () => {
    it('should call tradingService.getHistoryDealsByTime with accountId and time range', async () => {
      const accountId = 'test-account-123';
      const query: TimeRangeQueryDto = {
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-31T23:59:59.999Z',
      };
      const mockDeals = [
        {
          id: 'deal1',
          symbol: 'EURUSD',
          type: 'DEAL_TYPE_BUY',
          volume: 0.01,
          price: 1.1234,
          profit: 10,
          time: '2024-01-15T10:30:00.000Z',
        },
      ];

      jest.spyOn(service, 'getHistoryDealsByTime').mockResolvedValue(mockDeals);

      const result = await controller.getHistoryDealsByTime(accountId, query);

      expect(service.getHistoryDealsByTime).toHaveBeenCalledWith(
        accountId,
        new Date(query.startTime),
        new Date(query.endTime),
      );
      expect(service.getHistoryDealsByTime).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDeals);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const query: TimeRangeQueryDto = {
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-31T23:59:59.999Z',
      };
      const error = new Error('Failed to get deals');
      jest.spyOn(service, 'getHistoryDealsByTime').mockRejectedValue(error);

      await expect(
        controller.getHistoryDealsByTime(accountId, query),
      ).rejects.toThrow('Failed to get deals');
    });
  });

  describe('getHistoryDealsByTicket', () => {
    it('should call tradingService.getHistoryDealsByTicket with accountId and ticket', async () => {
      const accountId = 'test-account-123';
      const ticket = '12345678';
      const mockDeals = [
        {
          id: 'deal1',
          symbol: 'EURUSD',
          type: 'DEAL_TYPE_BUY',
          volume: 0.01,
          price: 1.1234,
          profit: 10,
          time: '2024-01-15T10:30:00.000Z',
        },
      ];

      jest
        .spyOn(service, 'getHistoryDealsByTicket')
        .mockResolvedValue(mockDeals);

      const result = await controller.getHistoryDealsByTicket(
        accountId,
        ticket,
      );

      expect(service.getHistoryDealsByTicket).toHaveBeenCalledWith(
        accountId,
        ticket,
      );
      expect(service.getHistoryDealsByTicket).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDeals);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const ticket = '12345678';
      const error = new Error('Failed to get deals by ticket');
      jest.spyOn(service, 'getHistoryDealsByTicket').mockRejectedValue(error);

      await expect(
        controller.getHistoryDealsByTicket(accountId, ticket),
      ).rejects.toThrow('Failed to get deals by ticket');
    });
  });

  // ==================== Symbol Information Endpoints ====================

  describe('getSymbols', () => {
    it('should call tradingService.getSymbols with accountId', async () => {
      const accountId = 'test-account-123';
      const mockSymbols = ['EURUSD', 'GBPUSD', 'USDJPY'];

      jest.spyOn(service, 'getSymbols').mockResolvedValue(mockSymbols);

      const result = await controller.getSymbols(accountId);

      expect(service.getSymbols).toHaveBeenCalledWith(accountId);
      expect(service.getSymbols).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSymbols);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const error = new Error('Failed to get symbols');
      jest.spyOn(service, 'getSymbols').mockRejectedValue(error);

      await expect(controller.getSymbols(accountId)).rejects.toThrow(
        'Failed to get symbols',
      );
    });
  });

  describe('getSymbolSpec', () => {
    it('should call tradingService.getSymbolSpec with accountId and symbol', async () => {
      const accountId = 'test-account-123';
      const symbol = 'EURUSD';
      const mockSpec = {
        symbol: 'EURUSD',
        description: 'Euro vs US Dollar',
        digits: 5,
        minVolume: 0.01,
        maxVolume: 100,
        volumeStep: 0.01,
      };

      jest.spyOn(service, 'getSymbolSpec').mockResolvedValue(mockSpec);

      const result = await controller.getSymbolSpec(accountId, symbol);

      expect(service.getSymbolSpec).toHaveBeenCalledWith(accountId, symbol);
      expect(service.getSymbolSpec).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSpec);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const symbol = 'EURUSD';
      const error = new Error('Symbol not found');
      jest.spyOn(service, 'getSymbolSpec').mockRejectedValue(error);

      await expect(controller.getSymbolSpec(accountId, symbol)).rejects.toThrow(
        'Symbol not found',
      );
    });
  });

  describe('getCurrentPrice', () => {
    it('should call tradingService.getCurrentPrice with accountId and symbol', async () => {
      const accountId = 'test-account-123';
      const symbol = 'EURUSD';
      const mockPrice = {
        bid: 1.1234,
        ask: 1.1236,
        time: '2024-01-15T10:30:00.000Z',
      };

      jest.spyOn(service, 'getCurrentPrice').mockResolvedValue(mockPrice);

      const result = await controller.getCurrentPrice(accountId, symbol);

      expect(service.getCurrentPrice).toHaveBeenCalledWith(accountId, symbol);
      expect(service.getCurrentPrice).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockPrice);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const symbol = 'EURUSD';
      const error = new Error('Failed to get current price');
      jest.spyOn(service, 'getCurrentPrice').mockRejectedValue(error);

      await expect(
        controller.getCurrentPrice(accountId, symbol),
      ).rejects.toThrow('Failed to get current price');
    });
  });

  // ==================== Market Data Endpoints ====================

  describe('getCandles', () => {
    it('should call tradingService.getCandles with accountId, symbol, and timeframe', async () => {
      const accountId = 'test-account-123';
      const symbol = 'EURUSD';
      const query: CandlesQueryDto = { timeframe: '1h' };
      const mockCandles = [
        {
          time: '2024-01-15T10:00:00.000Z',
          open: 1.1234,
          high: 1.1244,
          low: 1.123,
          close: 1.124,
          tickVolume: 1000,
        },
      ];

      jest.spyOn(service, 'getCandles').mockResolvedValue(mockCandles);

      const result = await controller.getCandles(accountId, symbol, query);

      expect(service.getCandles).toHaveBeenCalledWith(
        accountId,
        symbol,
        query.timeframe,
      );
      expect(service.getCandles).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCandles);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const symbol = 'EURUSD';
      const query: CandlesQueryDto = { timeframe: '1h' };
      const error = new Error('Failed to get candles');
      jest.spyOn(service, 'getCandles').mockRejectedValue(error);

      await expect(
        controller.getCandles(accountId, symbol, query),
      ).rejects.toThrow('Failed to get candles');
    });
  });

  describe('getTicks', () => {
    it('should call tradingService.getTicks with accountId and symbol', async () => {
      const accountId = 'test-account-123';
      const symbol = 'EURUSD';
      const mockTicks = [
        {
          time: '2024-01-15T10:30:00.000Z',
          bid: 1.1234,
          ask: 1.1236,
        },
      ];

      jest.spyOn(service, 'getTicks').mockResolvedValue(mockTicks);

      const result = await controller.getTicks(accountId, symbol);

      expect(service.getTicks).toHaveBeenCalledWith(accountId, symbol);
      expect(service.getTicks).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTicks);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const symbol = 'EURUSD';
      const error = new Error('Failed to get ticks');
      jest.spyOn(service, 'getTicks').mockRejectedValue(error);

      await expect(controller.getTicks(accountId, symbol)).rejects.toThrow(
        'Failed to get ticks',
      );
    });
  });

  describe('getOrderBook', () => {
    it('should call tradingService.getOrderBook with accountId and symbol', async () => {
      const accountId = 'test-account-123';
      const symbol = 'EURUSD';
      const mockOrderBook = {
        time: '2024-01-15T10:30:00.000Z',
        book: [
          { type: 'BUY', price: 1.1234, volume: 100 },
          { type: 'SELL', price: 1.1236, volume: 150 },
        ],
      };

      jest.spyOn(service, 'getOrderBook').mockResolvedValue(mockOrderBook);

      const result = await controller.getOrderBook(accountId, symbol);

      expect(service.getOrderBook).toHaveBeenCalledWith(accountId, symbol);
      expect(service.getOrderBook).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockOrderBook);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const symbol = 'EURUSD';
      const error = new Error('Failed to get order book');
      jest.spyOn(service, 'getOrderBook').mockRejectedValue(error);

      await expect(controller.getOrderBook(accountId, symbol)).rejects.toThrow(
        'Failed to get order book',
      );
    });
  });

  // ==================== Trade Execution Endpoint ====================

  describe('executeTrade', () => {
    it('should call tradingService.executeTrade with accountId and tradeDto', async () => {
      const accountId = 'test-account-123';
      const tradeDto: TradeDto = {
        actionType: 'ORDER_TYPE_BUY',
        symbol: 'EURUSD',
        volume: 0.01,
        stopLoss: 1.12,
        takeProfit: 1.13,
      };
      const mockResult = {
        numericCode: 10009,
        stringCode: 'TRADE_RETCODE_DONE',
        message: 'Request completed',
        orderId: 'ord123',
      };

      jest.spyOn(service, 'executeTrade').mockResolvedValue(mockResult);

      const result = await controller.executeTrade(accountId, tradeDto);

      expect(service.executeTrade).toHaveBeenCalledWith(accountId, tradeDto);
      expect(service.executeTrade).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const tradeDto: TradeDto = {
        actionType: 'ORDER_TYPE_BUY',
        symbol: 'EURUSD',
        volume: 0.01,
      };
      const error = new Error('Trade execution failed');
      jest.spyOn(service, 'executeTrade').mockRejectedValue(error);

      await expect(
        controller.executeTrade(accountId, tradeDto),
      ).rejects.toThrow('Trade execution failed');
    });
  });

  // ==================== Margin Calculation Endpoint ====================

  describe('calculateMargin', () => {
    it('should call tradingService.calculateMargin with accountId and query', async () => {
      const accountId = 'test-account-123';
      const query: MarginQueryDto = {
        symbol: 'EURUSD',
        type: 'ORDER_TYPE_BUY',
        volume: 0.01,
      };
      const mockResult = { margin: 11.23 };

      jest.spyOn(service, 'calculateMargin').mockResolvedValue(mockResult);

      const result = await controller.calculateMargin(accountId, query);

      expect(service.calculateMargin).toHaveBeenCalledWith(accountId, query);
      expect(service.calculateMargin).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const query: MarginQueryDto = {
        symbol: 'EURUSD',
        type: 'ORDER_TYPE_BUY',
        volume: 0.01,
      };
      const error = new Error('Margin calculation failed');
      jest.spyOn(service, 'calculateMargin').mockRejectedValue(error);

      await expect(
        controller.calculateMargin(accountId, query),
      ).rejects.toThrow('Margin calculation failed');
    });
  });
});

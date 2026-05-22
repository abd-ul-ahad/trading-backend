import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TradingService } from './trading.service';
import { AnalyticsService } from './analytics.service';
import {
  TradeDto,
  TimeRangeQueryDto,
  CandlesQueryDto,
  MarginQueryDto,
  AnalyticsQueryDto,
} from './dto';
import {
  AccountInformation,
  Position,
  PendingOrder,
  HistoryOrder,
  Deal,
  CurrentPrice,
  SymbolSpec,
  Candle,
  Tick,
  OrderBook,
  TradeResult,
  ServerTime,
  MarginResult,
  CpuCredits,
} from '../../integrations/metaapi/interfaces';
import { AnalyticsResponse } from './interfaces';
@Controller('trading')
export class TradingController {
  constructor(
    private readonly tradingService: TradingService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  // ==================== Account Information Endpoints ====================

  @Get('accounts/:accountId/information')
  async getAccountInformation(
    @Param('accountId') accountId: string,
  ): Promise<AccountInformation> {
    return this.tradingService.getAccountInformation(accountId);
  }

  @Get('accounts/:accountId/server-time')
  async getServerTime(
    @Param('accountId') accountId: string,
  ): Promise<ServerTime> {
    return this.tradingService.getServerTime(accountId);
  }

  @Get('accounts/:accountId/cpu-credits')
  async getCpuCredits(
    @Param('accountId') accountId: string,
  ): Promise<CpuCredits> {
    return this.tradingService.getCpuCredits(accountId);
  }

  // ==================== Position Endpoints ====================

  @Get('accounts/:accountId/positions')
  async getPositions(
    @Param('accountId') accountId: string,
  ): Promise<Position[]> {
    return this.tradingService.getPositions(accountId);
  }

  @Get('accounts/:accountId/positions/:positionId')
  async getPosition(
    @Param('accountId') accountId: string,
    @Param('positionId') positionId: string,
  ): Promise<Position> {
    return this.tradingService.getPosition(accountId, positionId);
  }

  // ==================== Pending Order Endpoints ====================

  @Get('accounts/:accountId/orders')
  async getOrders(
    @Param('accountId') accountId: string,
  ): Promise<PendingOrder[]> {
    return this.tradingService.getOrders(accountId);
  }

  @Get('accounts/:accountId/orders/:orderId')
  async getOrder(
    @Param('accountId') accountId: string,
    @Param('orderId') orderId: string,
  ): Promise<PendingOrder> {
    return this.tradingService.getOrder(accountId, orderId);
  }

  // ==================== Historical Order Endpoints ====================

  @Get('accounts/:accountId/history-orders/time')
  async getHistoryOrdersByTime(
    @Param('accountId') accountId: string,
    @Query() query: TimeRangeQueryDto,
  ): Promise<HistoryOrder[]> {
    const startTime = new Date(query.startTime);
    const endTime = new Date(query.endTime);
    return this.tradingService.getHistoryOrdersByTime(
      accountId,
      startTime,
      endTime,
    );
  }

  @Get('accounts/:accountId/history-orders/ticket/:ticket')
  async getHistoryOrdersByTicket(
    @Param('accountId') accountId: string,
    @Param('ticket') ticket: string,
  ): Promise<HistoryOrder[]> {
    return this.tradingService.getHistoryOrdersByTicket(accountId, ticket);
  }

  // ==================== Deal History Endpoints ====================

  @Get('accounts/:accountId/deals/time')
  async getHistoryDealsByTime(
    @Param('accountId') accountId: string,
    @Query() query: TimeRangeQueryDto,
  ): Promise<Deal[]> {
    const startTime = new Date(query.startTime);
    const endTime = new Date(query.endTime);
    return this.tradingService.getHistoryDealsByTime(
      accountId,
      startTime,
      endTime,
    );
  }

  @Get('accounts/:accountId/deals/ticket/:ticket')
  async getHistoryDealsByTicket(
    @Param('accountId') accountId: string,
    @Param('ticket') ticket: string,
  ): Promise<Deal[]> {
    return this.tradingService.getHistoryDealsByTicket(accountId, ticket);
  }

  // ==================== Symbol Information Endpoints ====================

  @Get('accounts/:accountId/symbols')
  async getSymbols(@Param('accountId') accountId: string): Promise<string[]> {
    return this.tradingService.getSymbols(accountId);
  }

  @Get('accounts/:accountId/symbols/:symbol/specification')
  async getSymbolSpec(
    @Param('accountId') accountId: string,
    @Param('symbol') symbol: string,
  ): Promise<SymbolSpec> {
    return this.tradingService.getSymbolSpec(accountId, symbol);
  }

  @Get('accounts/:accountId/symbols/:symbol/price')
  async getCurrentPrice(
    @Param('accountId') accountId: string,
    @Param('symbol') symbol: string,
  ): Promise<CurrentPrice> {
    return this.tradingService.getCurrentPrice(accountId, symbol);
  }

  // ==================== Market Data Endpoints ====================

  @Get('accounts/:accountId/symbols/:symbol/candles')
  async getCandles(
    @Param('accountId') accountId: string,
    @Param('symbol') symbol: string,
    @Query() query: CandlesQueryDto,
  ): Promise<Candle[]> {
    return this.tradingService.getCandles(accountId, symbol, query.timeframe);
  }

  @Get('accounts/:accountId/symbols/:symbol/ticks')
  async getTicks(
    @Param('accountId') accountId: string,
    @Param('symbol') symbol: string,
  ): Promise<Tick[]> {
    return this.tradingService.getTicks(accountId, symbol);
  }

  @Get('accounts/:accountId/symbols/:symbol/order-book')
  async getOrderBook(
    @Param('accountId') accountId: string,
    @Param('symbol') symbol: string,
  ): Promise<OrderBook> {
    return this.tradingService.getOrderBook(accountId, symbol);
  }

  // ==================== Trade Execution Endpoint ====================

  @Post('accounts/:accountId/trade')
  async executeTrade(
    @Param('accountId') accountId: string,
    @Body() tradeDto: TradeDto,
  ): Promise<TradeResult> {
    return this.tradingService.executeTrade(accountId, tradeDto);
  }

  // ==================== Margin Calculation Endpoint ====================

  @Get('accounts/:accountId/margin')
  async calculateMargin(
    @Param('accountId') accountId: string,
    @Query() query: MarginQueryDto,
  ): Promise<MarginResult> {
    return this.tradingService.calculateMargin(accountId, query);
  }

  // ==================== Analytics Endpoint ====================

  @Get('accounts/:accountId/analytics')
  async getAccountAnalytics(
    @Param('accountId') accountId: string,
    @Query() query: AnalyticsQueryDto,
  ): Promise<AnalyticsResponse> {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    return this.analyticsService.getAccountAnalytics(
      accountId,
      startDate,
      endDate,
      query.strategyId,
    );
  }
}

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
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

@ApiTags('Trading')
@Controller('trading')
export class TradingController {
  constructor(
    private readonly tradingService: TradingService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  // ==================== Account Information Endpoints ====================

  @Get('accounts/:accountId/information')
  @ApiOperation({ summary: 'Get account information' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Account information retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAccountInformation(
    @Param('accountId') accountId: string,
  ): Promise<AccountInformation> {
    return this.tradingService.getAccountInformation(accountId);
  }

  @Get('accounts/:accountId/server-time')
  @ApiOperation({ summary: 'Get server time' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Server time retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getServerTime(@Param('accountId') accountId: string): Promise<ServerTime> {
    return this.tradingService.getServerTime(accountId);
  }

  @Get('accounts/:accountId/cpu-credits')
  @ApiOperation({ summary: 'Get CPU credits' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'CPU credits retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getCpuCredits(@Param('accountId') accountId: string): Promise<CpuCredits> {
    return this.tradingService.getCpuCredits(accountId);
  }

  // ==================== Position Endpoints ====================

  @Get('accounts/:accountId/positions')
  @ApiOperation({ summary: 'Get all positions' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Positions retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPositions(@Param('accountId') accountId: string): Promise<Position[]> {
    return this.tradingService.getPositions(accountId);
  }

  @Get('accounts/:accountId/positions/:positionId')
  @ApiOperation({ summary: 'Get a single position' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiParam({
    name: 'positionId',
    description: 'Position ID',
    example: 'pos123',
  })
  @ApiResponse({
    status: 200,
    description: 'Position retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Position not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPosition(
    @Param('accountId') accountId: string,
    @Param('positionId') positionId: string,
  ): Promise<Position> {
    return this.tradingService.getPosition(accountId, positionId);
  }

  // ==================== Pending Order Endpoints ====================

  @Get('accounts/:accountId/orders')
  @ApiOperation({ summary: 'Get all pending orders' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending orders retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getOrders(@Param('accountId') accountId: string): Promise<PendingOrder[]> {
    return this.tradingService.getOrders(accountId);
  }

  @Get('accounts/:accountId/orders/:orderId')
  @ApiOperation({ summary: 'Get a single pending order' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Order ID',
    example: 'ord123',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending order retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getOrder(
    @Param('accountId') accountId: string,
    @Param('orderId') orderId: string,
  ): Promise<PendingOrder> {
    return this.tradingService.getOrder(accountId, orderId);
  }

  // ==================== Historical Order Endpoints ====================

  @Get('accounts/:accountId/history-orders/time')
  @ApiOperation({ summary: 'Get historical orders by time range' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiQuery({
    name: 'startTime',
    description: 'Start time in ISO 8601 format',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endTime',
    description: 'End time in ISO 8601 format',
    example: '2024-01-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical orders retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid time range (startTime must be before endTime)',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getHistoryOrdersByTime(
    @Param('accountId') accountId: string,
    @Query() query: TimeRangeQueryDto,
  ): Promise<HistoryOrder[]> {
    const startTime = new Date(query.startTime);
    const endTime = new Date(query.endTime);
    return this.tradingService.getHistoryOrdersByTime(accountId, startTime, endTime);
  }

  @Get('accounts/:accountId/history-orders/ticket/:ticket')
  @ApiOperation({ summary: 'Get historical orders by ticket' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiParam({
    name: 'ticket',
    description: 'Order ticket number',
    example: '12345678',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical orders retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getHistoryOrdersByTicket(
    @Param('accountId') accountId: string,
    @Param('ticket') ticket: string,
  ): Promise<HistoryOrder[]> {
    return this.tradingService.getHistoryOrdersByTicket(accountId, ticket);
  }

  // ==================== Deal History Endpoints ====================

  @Get('accounts/:accountId/deals/time')
  @ApiOperation({ summary: 'Get deals by time range' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiQuery({
    name: 'startTime',
    description: 'Start time in ISO 8601 format',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endTime',
    description: 'End time in ISO 8601 format',
    example: '2024-01-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Deals retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid time range (startTime must be before endTime)',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getHistoryDealsByTime(
    @Param('accountId') accountId: string,
    @Query() query: TimeRangeQueryDto,
  ): Promise<Deal[]> {
    const startTime = new Date(query.startTime);
    const endTime = new Date(query.endTime);
    return this.tradingService.getHistoryDealsByTime(accountId, startTime, endTime);
  }

  @Get('accounts/:accountId/deals/ticket/:ticket')
  @ApiOperation({ summary: 'Get deals by ticket' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiParam({
    name: 'ticket',
    description: 'Deal ticket number',
    example: '12345678',
  })
  @ApiResponse({
    status: 200,
    description: 'Deals retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getHistoryDealsByTicket(
    @Param('accountId') accountId: string,
    @Param('ticket') ticket: string,
  ): Promise<Deal[]> {
    return this.tradingService.getHistoryDealsByTicket(accountId, ticket);
  }

  // ==================== Symbol Information Endpoints ====================

  @Get('accounts/:accountId/symbols')
  @ApiOperation({ summary: 'Get all available symbols' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Symbols retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getSymbols(@Param('accountId') accountId: string): Promise<string[]> {
    return this.tradingService.getSymbols(accountId);
  }

  @Get('accounts/:accountId/symbols/:symbol/specification')
  @ApiOperation({ summary: 'Get symbol specification' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiParam({
    name: 'symbol',
    description: 'Trading symbol',
    example: 'EURUSD',
  })
  @ApiResponse({
    status: 200,
    description: 'Symbol specification retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Symbol not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getSymbolSpec(
    @Param('accountId') accountId: string,
    @Param('symbol') symbol: string,
  ): Promise<SymbolSpec> {
    return this.tradingService.getSymbolSpec(accountId, symbol);
  }

  @Get('accounts/:accountId/symbols/:symbol/price')
  @ApiOperation({ summary: 'Get current price for a symbol' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiParam({
    name: 'symbol',
    description: 'Trading symbol',
    example: 'EURUSD',
  })
  @ApiResponse({
    status: 200,
    description: 'Current price retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Symbol not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getCurrentPrice(
    @Param('accountId') accountId: string,
    @Param('symbol') symbol: string,
  ): Promise<CurrentPrice> {
    return this.tradingService.getCurrentPrice(accountId, symbol);
  }

  // ==================== Market Data Endpoints ====================

  @Get('accounts/:accountId/symbols/:symbol/candles')
  @ApiOperation({ summary: 'Get candle data for a symbol' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiParam({
    name: 'symbol',
    description: 'Trading symbol',
    example: 'EURUSD',
  })
  @ApiQuery({
    name: 'timeframe',
    description: 'Candle timeframe',
    example: '1h',
    enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'],
  })
  @ApiResponse({
    status: 200,
    description: 'Candle data retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid timeframe' })
  @ApiResponse({ status: 404, description: 'Symbol not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getCandles(
    @Param('accountId') accountId: string,
    @Param('symbol') symbol: string,
    @Query() query: CandlesQueryDto,
  ): Promise<Candle[]> {
    return this.tradingService.getCandles(accountId, symbol, query.timeframe);
  }

  @Get('accounts/:accountId/symbols/:symbol/ticks')
  @ApiOperation({ summary: 'Get tick data for a symbol' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiParam({
    name: 'symbol',
    description: 'Trading symbol',
    example: 'EURUSD',
  })
  @ApiResponse({
    status: 200,
    description: 'Tick data retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Symbol not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTicks(
    @Param('accountId') accountId: string,
    @Param('symbol') symbol: string,
  ): Promise<Tick[]> {
    return this.tradingService.getTicks(accountId, symbol);
  }

  @Get('accounts/:accountId/symbols/:symbol/order-book')
  @ApiOperation({ summary: 'Get order book for a symbol' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiParam({
    name: 'symbol',
    description: 'Trading symbol',
    example: 'EURUSD',
  })
  @ApiResponse({
    status: 200,
    description: 'Order book retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Symbol not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getOrderBook(
    @Param('accountId') accountId: string,
    @Param('symbol') symbol: string,
  ): Promise<OrderBook> {
    return this.tradingService.getOrderBook(accountId, symbol);
  }

  // ==================== Trade Execution Endpoint ====================

  @Post('accounts/:accountId/trade')
  @ApiOperation({ summary: 'Execute a trade' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiBody({
    type: TradeDto,
    description: 'Trade execution parameters',
  })
  @ApiResponse({
    status: 200,
    description: 'Trade executed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid trade parameters',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async executeTrade(
    @Param('accountId') accountId: string,
    @Body() tradeDto: TradeDto,
  ): Promise<TradeResult> {
    return this.tradingService.executeTrade(accountId, tradeDto);
  }

  // ==================== Margin Calculation Endpoint ====================

  @Get('accounts/:accountId/margin')
  @ApiOperation({ summary: 'Calculate margin requirement' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiQuery({
    name: 'symbol',
    description: 'Trading symbol',
    example: 'EURUSD',
  })
  @ApiQuery({
    name: 'type',
    description: 'Order type',
    example: 'ORDER_TYPE_BUY',
  })
  @ApiQuery({
    name: 'volume',
    description: 'Trade volume in lots',
    example: 0.01,
  })
  @ApiResponse({
    status: 200,
    description: 'Margin calculated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid margin calculation parameters',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async calculateMargin(
    @Param('accountId') accountId: string,
    @Query() query: MarginQueryDto,
  ): Promise<MarginResult> {
    return this.tradingService.calculateMargin(accountId, query);
  }

  // ==================== Analytics Endpoint ====================

  @Get('accounts/:accountId/analytics')
  @ApiOperation({ summary: 'Get account analytics and statistics' })
  @ApiParam({
    name: 'accountId',
    description: 'MetaAPI account ID',
    example: 'abc123',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date in ISO 8601 format',
    example: '2024-04-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date in ISO 8601 format',
    example: '2024-05-06T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'strategyId',
    description: 'Optional strategy ID to filter analytics',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
    type: AnalyticsResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid date range (startDate must be before endDate)',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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

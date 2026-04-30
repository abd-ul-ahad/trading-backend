import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { MetaApiConfigService } from '../../integrations/metaapi/metaapi-config.service';
import { handleHttpError } from '../../integrations/metaapi/metaapi-error.handler';
import {
  AccountInformation,
  Candle,
  CpuCredits,
  CurrentPrice,
  Deal,
  HistoryOrder,
  MarginDto,
  MarginResult,
  OrderBook,
  PendingOrder,
  Position,
  ServerTime,
  SymbolSpec,
  Tick,
  TradeDto,
  TradeResult,
} from '../../integrations/metaapi/interfaces';

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly config: MetaApiConfigService,
  ) {}

  private authHeaders() {
    return { headers: { 'auth-token': this.config.accountToken } };
  }

  async getAccountInformation(accountId: string): Promise<AccountInformation> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<AccountInformation>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/account-information`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getPositions(accountId: string): Promise<Position[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Position[]>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/positions`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getPosition(accountId: string, positionId: string): Promise<Position> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Position>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/positions/${positionId}`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getOrders(accountId: string): Promise<PendingOrder[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<PendingOrder[]>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/orders`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getOrder(accountId: string, orderId: string): Promise<PendingOrder> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<PendingOrder>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/orders/${orderId}`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getHistoryOrdersByTime(
    accountId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<HistoryOrder[]> {
    if (startTime > endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }
    try {
      const response = await firstValueFrom(
        this.httpService.get<HistoryOrder[]>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/history-orders/time/${startTime.toISOString()}/${endTime.toISOString()}`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getHistoryDealsByTime(
    accountId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<Deal[]> {
    if (startTime > endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }
    try {
      const response = await firstValueFrom(
        this.httpService.get<Deal[]>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/deals/time/${startTime.toISOString()}/${endTime.toISOString()}`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getHistoryOrdersByTicket(
    accountId: string,
    ticket: string,
  ): Promise<HistoryOrder[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<HistoryOrder[]>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/history-orders/ticket/${ticket}`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getHistoryDealsByTicket(
    accountId: string,
    ticket: string,
  ): Promise<Deal[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Deal[]>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/deals/ticket/${ticket}`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getSymbols(accountId: string): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<string[]>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/symbols`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getSymbolSpec(accountId: string, symbol: string): Promise<SymbolSpec> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<SymbolSpec>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/symbols/${symbol}`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getCurrentPrice(
    accountId: string,
    symbol: string,
  ): Promise<CurrentPrice> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<CurrentPrice>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/symbols/${symbol}/current-price`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getCandles(
    accountId: string,
    symbol: string,
    timeframe: string,
  ): Promise<Candle[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Candle[]>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/symbols/${symbol}/candles`,
          { ...this.authHeaders(), params: { timeframe } },
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getTicks(accountId: string, symbol: string): Promise<Tick[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Tick[]>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/symbols/${symbol}/ticks`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getOrderBook(accountId: string, symbol: string): Promise<OrderBook> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<OrderBook>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/symbols/${symbol}/book`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async executeTrade(accountId: string, dto: TradeDto): Promise<TradeResult> {
    if (!dto.actionType) {
      throw new BadRequestException('actionType is required');
    }

    const orderTypes: TradeDto['actionType'][] = [
      'ORDER_TYPE_BUY',
      'ORDER_TYPE_SELL',
      'ORDER_TYPE_BUY_LIMIT',
      'ORDER_TYPE_SELL_LIMIT',
      'ORDER_TYPE_BUY_STOP',
      'ORDER_TYPE_SELL_STOP',
    ];

    if (orderTypes.includes(dto.actionType) && (!dto.symbol || !dto.volume)) {
      throw new BadRequestException(
        'symbol and volume are required for market/limit/stop orders',
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<TradeResult>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/trade`,
          dto,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getServerTime(accountId: string): Promise<ServerTime> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<ServerTime>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/server-time`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async calculateMargin(
    accountId: string,
    dto: MarginDto,
  ): Promise<MarginResult> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<MarginResult>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/margin`,
          { ...this.authHeaders(), params: dto },
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }

  async getCpuCredits(accountId: string): Promise<CpuCredits> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<CpuCredits>(
          `${this.config.tradingBaseUrl}/users/current/accounts/${accountId}/cpu-credits`,
          this.authHeaders(),
        ),
      );
      return response.data;
    } catch (error) {
      handleHttpError(error, this.logger);
    }
  }
}

export interface AccountInformation {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  currency: string;
  leverage: number;
  [key: string]: unknown;
}

export interface Position {
  id: string;
  symbol: string;
  type: 'POSITION_TYPE_BUY' | 'POSITION_TYPE_SELL';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  swap: number;
  /**
   * Optional client-supplied comment on the originating order. Used by the
   * strategy-sync pipeline to attribute the position to a Strategy via the
   * `STRAT:<uuid>` convention.
   */
  comment?: string;
  /**
   * Position open time as reported by the broker (ISO 8601 string).
   */
  time?: string;
  [key: string]: unknown;
}

export interface PendingOrder {
  id: string;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  currentPrice: number;
  state: string;
  [key: string]: unknown;
}

export interface HistoryOrder {
  id: string;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  closePrice: number;
  state: string;
  doneTime: string;
  [key: string]: unknown;
}

export type DealEntryType =
  | 'DEAL_ENTRY_IN'
  | 'DEAL_ENTRY_OUT'
  | 'DEAL_ENTRY_INOUT'
  | 'DEAL_ENTRY_OUT_BY';

export type DealType =
  | 'DEAL_TYPE_BUY'
  | 'DEAL_TYPE_SELL'
  | 'DEAL_TYPE_BALANCE'
  | 'DEAL_TYPE_CREDIT'
  | 'DEAL_TYPE_CHARGE'
  | 'DEAL_TYPE_CORRECTION'
  | 'DEAL_TYPE_BONUS'
  | 'DEAL_TYPE_COMMISSION'
  | 'DEAL_TYPE_COMMISSION_DAILY'
  | 'DEAL_TYPE_COMMISSION_MONTHLY'
  | 'DEAL_TYPE_AGENT_DAILY'
  | 'DEAL_TYPE_AGENT_MONTHLY'
  | 'DEAL_TYPE_INTEREST'
  | 'DEAL_TYPE_BUY_CANCELED'
  | 'DEAL_TYPE_SELL_CANCELED';

export interface Deal {
  id: string;
  symbol: string;
  type: string;
  volume: number;
  price: number;
  profit: number;
  time: string;
  /**
   * MetaApi-assigned position identifier. Multiple deals (one entry,
   * one-or-more exits) share the same `positionId` for a given lifecycle.
   */
  positionId?: string;
  /**
   * Distinguishes whether this deal opens, closes, or reverses a position.
   */
  entryType?: DealEntryType;
  /**
   * Optional client-supplied comment on the originating order. Used by the
   * strategy-sync pipeline to attribute the deal to a Strategy via the
   * `STRAT:<uuid>` convention.
   */
  comment?: string;
  [key: string]: unknown;
}

export interface SymbolSpec {
  symbol: string;
  description: string;
  digits: number;
  minVolume: number;
  maxVolume: number;
  volumeStep: number;
  [key: string]: unknown;
}

export interface CurrentPrice {
  bid: number;
  ask: number;
  time: string;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  tickVolume: number;
}

export interface Tick {
  time: string;
  bid: number;
  ask: number;
}

export interface OrderBook {
  time: string;
  book: Array<{ type: string; price: number; volume: number }>;
}

export type TradeActionType =
  | 'ORDER_TYPE_BUY'
  | 'ORDER_TYPE_SELL'
  | 'ORDER_TYPE_BUY_LIMIT'
  | 'ORDER_TYPE_SELL_LIMIT'
  | 'ORDER_TYPE_BUY_STOP'
  | 'ORDER_TYPE_SELL_STOP'
  | 'POSITION_MODIFY'
  | 'POSITION_CLOSE_ID'
  | 'POSITION_CLOSE_SYMBOL'
  | 'ORDER_MODIFY'
  | 'ORDER_CANCEL';

export interface TradeDto {
  actionType: TradeActionType;
  symbol?: string;
  volume?: number;
  openPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  positionId?: string;
  orderId?: string;
  comment?: string;
}

export interface TradeResult {
  numericCode: number;
  stringCode: string;
  message: string;
  orderId?: string;
  positionId?: string;
}

export interface ServerTime {
  time: string;
  brokerTime: string;
}

export interface MarginDto {
  symbol: string;
  type: string;
  volume: number;
}

export interface MarginResult {
  margin: number;
}

export interface CpuCredits {
  cpuCredits: number;
}

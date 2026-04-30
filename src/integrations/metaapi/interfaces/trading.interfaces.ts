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

export interface Deal {
  id: string;
  symbol: string;
  type: string;
  volume: number;
  price: number;
  profit: number;
  time: string;
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

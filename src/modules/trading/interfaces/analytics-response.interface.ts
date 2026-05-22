export class PeriodInfo {
  startDate: string;
  endDate: string;
}

export class TradeStatistics {
  total: number;
  winning: number;
  losing: number;
  winRate: number;
}

export class ReturnMetrics {
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  realizedReturnPercent: number;
  unrealizedReturnPercent: number;
}

export class DrawdownMetrics {
  maxDrawdown: number;
  currentDrawdown: number;
  maxDrawdownDate: string | null;
}

export class AnalyticsResponse {
  period: PeriodInfo;
  trades: TradeStatistics;
  returns: ReturnMetrics;
  drawdown: DrawdownMetrics;
}

export class StrategyPerformanceDto {
  strategyId: string;
  totalReturn: number;
  totalPnL: number;
  unrealizedPnL: number;
  realizedPnL: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  maxDrawdown: number;
  currentDrawdown: number;
  lastUpdated: Date;
}

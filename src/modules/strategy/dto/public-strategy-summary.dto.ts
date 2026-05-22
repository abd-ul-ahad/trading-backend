/**
 * Public-facing strategy summary
 * Excludes sensitive information like capital invested
 * Only shows performance metrics (returns, win rate, drawdown)
 */
export class PublicStrategySummaryDto {
  strategyId: string;
  name: string;
  totalReturn: number;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
  lastUpdated: Date;
}

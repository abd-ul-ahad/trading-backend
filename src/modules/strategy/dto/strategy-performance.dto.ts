/**
 * Live performance metrics for a strategy.
 *
 * All trade counts and drawdown values are anchored to "day 1" — the earliest
 * `strategy_performance` snapshot for the strategy (dynamic, not a hard-coded
 * date).
 *
 * Field semantics:
 * - `totalTrades`: count of trades with `entry_time >= day1`, any status.
 * - `winningTrades` / `losingTrades`: closed trades only, partitioned by
 *   `pnl > 0` vs `pnl < 0`.
 * - `winRate`: closed-only — `winningTrades / total_closed_trades`. Open and
 *   cancelled trades are excluded from both numerator and denominator.
 * - `maxDrawdown`: largest peak-to-trough drop in `strategy_performance.total_pnl`
 *   observed since day 1, expressed in absolute USD (non-negative number).
 * - `currentDrawdown`: drop from the all-time peak to the most recent
 *   snapshot, also in absolute USD (non-negative).
 *
 * Note: `totalReturn` (% return) is intentionally not reported — it requires
 * an account-level "money in account" baseline which is out of scope for the
 * strategy endpoint.
 */
export class StrategyPerformanceDto {
  strategyId: string;
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

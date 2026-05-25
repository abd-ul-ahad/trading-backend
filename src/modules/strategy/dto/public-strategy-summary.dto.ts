/**
 * Public-facing strategy summary.
 *
 * Exposes only non-sensitive metrics (win rate, trade counts, drawdown). All
 * values are anchored to "day 1" — the earliest `strategy_performance`
 * snapshot for the strategy (dynamic, not a hard-coded date).
 *
 * Field semantics:
 * - `totalTrades`: count of trades with `entry_time >= day1`, any status.
 * - `winRate`: closed-only — `winning_closed / total_closed`. Open and
 *   cancelled trades are excluded.
 * - `maxDrawdown`: absolute USD peak-to-trough on
 *   `strategy_performance.total_pnl` since day 1 (non-negative).
 *
 * `totalReturn` is intentionally not exposed — it requires an account-level
 * "money in account" baseline which is out of scope here.
 */
export class PublicStrategySummaryDto {
  strategyId: string;
  name: string;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
  lastUpdated: Date;
}

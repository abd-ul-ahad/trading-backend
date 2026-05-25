/**
 * Per-strategy result returned by `POST /strategies/dev/seed`.
 *
 * `snapshotsInserted` / `tradesInserted` reflect what the seed actually wrote
 * to `strategy_performance` and `trades`. Real-time mirror rows are populated
 * automatically by PostgreSQL triggers and are not separately counted here.
 */
export class SeedResultDto {
  name: string;
  strategyId: string;
  snapshotsInserted: number;
  tradesInserted: number;
  closedTrades: number;
  openTrades: number;
  cancelledTrades: number;
  /** Day 1 used for snapshot timestamps (ISO 8601). */
  dayOne: string;
  /** Relative URL to fetch live performance for this seeded strategy. */
  performanceUrl: string;
  /** Relative URL to fetch the public summary for this seeded strategy. */
  publicSummaryUrl: string;
}

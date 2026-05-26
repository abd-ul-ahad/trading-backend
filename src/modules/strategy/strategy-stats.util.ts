/**
 * Strategy statistics — single source of truth.
 *
 * Both the read path (`StrategyService.getPerformance`) and the daily
 * sync writer (`StrategySyncService.writeTodaySnapshot`) MUST go through
 * this helper. Any change to "what does total_trades mean" or "how is
 * drawdown computed" lives in exactly one place here, so the two paths
 * cannot drift out of sync silently.
 *
 * The helper is pure: it takes already-fetched trades and snapshots and
 * returns a fully-computed `StrategyStats`. No DB access, no I/O.
 */

/**
 * Subset of `Trade` fields the stats math actually consumes. Using a
 * structural type instead of the Sequelize model keeps the helper
 * trivially unit-testable.
 */
export interface TradeForStats {
  entry_time: Date;
  status: string;
  pnl: number | string | null;
}

/**
 * Subset of `StrategyPerformance` snapshot fields the stats math
 * consumes. Snapshots must be ordered by timestamp ascending; callers
 * are responsible for that ordering at the query layer.
 */
export interface SnapshotForStats {
  timestamp: Date;
  total_pnl: number | string;
}

export interface StrategyStats {
  /** Count of trades with `entry_time >= day1`, all statuses. */
  totalTrades: number;
  /** Closed trades with pnl > 0. */
  winningTrades: number;
  /** Closed trades with pnl < 0. */
  losingTrades: number;
  /** `winningTrades / totalClosed`. Open and cancelled trades excluded. */
  winRate: number;
  /** Sum of pnl over closed trades since day1. */
  realizedPnL: number;
  /** Passed through from the caller (live broker positions sum). */
  unrealizedPnL: number;
  /** `realizedPnL + unrealizedPnL`. */
  totalPnL: number;
  /**
   * Largest peak-to-trough drop in the snapshot `total_pnl` series.
   * Peak must precede the trough; non-negative USD amount.
   */
  maxDrawdown: number;
  /** Drop from running peak to the most recent snapshot's `total_pnl`. */
  currentDrawdown: number;
}

/**
 * "Day 1" anchor for a strategy: the timestamp of its earliest
 * `strategy_performance` snapshot. Trades and drawdown counts are
 * anchored to this so a strategy's stats only reflect activity from
 * when it started running, not historical noise.
 *
 * Returns null when the strategy has no snapshots — in that case the
 * caller should return zeroed stats rather than calling
 * `computeStrategyStats`.
 */
export function pickDay1(snapshots: SnapshotForStats[]): Date | null {
  if (snapshots.length === 0) return null;
  // Caller passes snapshots in ASC order; trust it but guard against
  // the empty case above. We intentionally do NOT re-sort here — the
  // SQL ORDER BY is the source of truth for ordering.
  return snapshots[0].timestamp;
}

/**
 * Compute the full stats bundle from already-fetched inputs.
 *
 * Contract:
 *   - `trades` is every trade for the strategy, any status, any time.
 *     This function filters to `entry_time >= day1` internally.
 *   - `snapshots` is the full `strategy_performance` series for the
 *     strategy in ASC timestamp order.
 *   - `unrealizedPnL` is the caller's live unrealised value (from
 *     broker positions, real-time mirror, or 0 when unknown).
 *   - `day1` should come from `pickDay1(snapshots)` — passed in
 *     separately so the writer (which already has `snapshots[0]`) can
 *     avoid a redundant lookup.
 */
export function computeStrategyStats(
  trades: TradeForStats[],
  snapshots: SnapshotForStats[],
  unrealizedPnL: number,
  day1: Date,
): StrategyStats {
  const tradesSinceDay1 = trades.filter(
    (t) => t.entry_time >= day1,
  );

  const closedTrades = tradesSinceDay1.filter((t) => t.status === 'closed');
  const winningTrades = closedTrades.filter(
    (t) => Number(t.pnl ?? 0) > 0,
  ).length;
  const losingTrades = closedTrades.filter(
    (t) => Number(t.pnl ?? 0) < 0,
  ).length;
  const winRate =
    closedTrades.length > 0 ? winningTrades / closedTrades.length : 0;

  const realizedPnL = closedTrades.reduce(
    (s, t) => s + Number(t.pnl ?? 0),
    0,
  );
  const totalPnL = realizedPnL + unrealizedPnL;

  const { maxDrawdown, currentDrawdown } = computeDrawdown(snapshots);

  return {
    totalTrades: tradesSinceDay1.length,
    winningTrades,
    losingTrades,
    winRate,
    realizedPnL,
    unrealizedPnL,
    totalPnL,
    maxDrawdown,
    currentDrawdown,
  };
}

/**
 * Walk an ASC-ordered series and return max + current drawdown in
 * absolute USD. Peak must precede the trough; `currentDrawdown` is the
 * drop from the running peak to the final point.
 *
 * Both values are non-negative. Returns `{ 0, 0 }` for an empty series.
 *
 * Exported so the sync writer can include "today's not-yet-stored
 * total_pnl" by appending one synthetic snapshot before calling.
 */
export function computeDrawdown(snapshots: SnapshotForStats[]): {
  maxDrawdown: number;
  currentDrawdown: number;
} {
  let peak = -Infinity;
  let maxDrawdown = 0;
  let currentDrawdown = 0;
  for (const snap of snapshots) {
    const v = Number(snap.total_pnl);
    if (v > peak) peak = v;
    const dd = peak - v;
    if (dd > maxDrawdown) maxDrawdown = dd;
    currentDrawdown = dd;
  }
  return { maxDrawdown, currentDrawdown };
}

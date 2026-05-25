/**
 * Equity curve data point.
 *
 * Note: the `equity` field (initial_capital + total_pnl) was removed when
 * initial_capital was dropped from the strategies table. `totalPnL` captures
 * cumulative growth from a zero baseline.
 */
export class EquityCurvePointDto {
  timestamp: Date;
  totalPnL: number;
  drawdown: number;
}

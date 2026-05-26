import {
  computeDrawdown,
  computeStrategyStats,
  pickDay1,
  SnapshotForStats,
  TradeForStats,
} from './strategy-stats.util';

describe('strategy-stats.util', () => {
  const day1 = new Date('2024-04-20T00:00:00.000Z');
  const day2 = new Date('2024-04-21T00:00:00.000Z');
  const day3 = new Date('2024-04-22T00:00:00.000Z');

  describe('pickDay1', () => {
    it('returns the first snapshot timestamp', () => {
      const snaps: SnapshotForStats[] = [
        { timestamp: day1, total_pnl: 0 },
        { timestamp: day2, total_pnl: 10 },
      ];
      expect(pickDay1(snaps)).toEqual(day1);
    });

    it('returns null for empty snapshots', () => {
      expect(pickDay1([])).toBeNull();
    });
  });

  describe('computeDrawdown', () => {
    it('returns zero for empty series', () => {
      expect(computeDrawdown([])).toEqual({
        maxDrawdown: 0,
        currentDrawdown: 0,
      });
    });

    it('tracks peak-to-trough max drawdown', () => {
      const snaps: SnapshotForStats[] = [
        { timestamp: day1, total_pnl: 100 },
        { timestamp: day2, total_pnl: 150 },
        { timestamp: day3, total_pnl: 80 },
      ];
      expect(computeDrawdown(snaps)).toEqual({
        maxDrawdown: 70,
        currentDrawdown: 70,
      });
    });

    it('current drawdown reflects most recent point relative to running peak', () => {
      const snaps: SnapshotForStats[] = [
        { timestamp: day1, total_pnl: 100 },
        { timestamp: day2, total_pnl: 50 }, // dd=50
        { timestamp: day3, total_pnl: 90 }, // dd=10
      ];
      expect(computeDrawdown(snaps)).toEqual({
        maxDrawdown: 50,
        currentDrawdown: 10,
      });
    });

    it('coerces decimal-string total_pnl', () => {
      const snaps: SnapshotForStats[] = [
        { timestamp: day1, total_pnl: '100' as unknown as number },
        { timestamp: day2, total_pnl: '50' as unknown as number },
      ];
      expect(computeDrawdown(snaps).currentDrawdown).toBe(50);
    });
  });

  describe('computeStrategyStats', () => {
    const trade = (
      overrides: Partial<TradeForStats> = {},
    ): TradeForStats => ({
      entry_time: day1,
      status: 'closed',
      pnl: 0,
      ...overrides,
    });

    it('counts only trades since day1', () => {
      const olderDay = new Date('2024-04-19T00:00:00.000Z');
      const trades: TradeForStats[] = [
        trade({ entry_time: olderDay, pnl: 999 }),
        trade({ entry_time: day1, pnl: 10 }),
        trade({ entry_time: day2, pnl: -5 }),
      ];
      const snaps: SnapshotForStats[] = [
        { timestamp: day1, total_pnl: 0 },
      ];
      const result = computeStrategyStats(trades, snaps, 0, day1);
      expect(result.totalTrades).toBe(2);
      expect(result.realizedPnL).toBe(5);
    });

    it('excludes open/cancelled trades from win rate', () => {
      const trades: TradeForStats[] = [
        trade({ status: 'closed', pnl: 10 }),
        trade({ status: 'open', pnl: null }),
        trade({ status: 'cancelled', pnl: null }),
      ];
      const snaps: SnapshotForStats[] = [
        { timestamp: day1, total_pnl: 0 },
      ];
      const result = computeStrategyStats(trades, snaps, 0, day1);
      expect(result.totalTrades).toBe(3);
      expect(result.winningTrades).toBe(1);
      expect(result.losingTrades).toBe(0);
      expect(result.winRate).toBe(1);
    });

    it('returns zero winRate when no closed trades', () => {
      const trades: TradeForStats[] = [trade({ status: 'open', pnl: null })];
      const snaps: SnapshotForStats[] = [
        { timestamp: day1, total_pnl: 0 },
      ];
      const result = computeStrategyStats(trades, snaps, 0, day1);
      expect(result.winRate).toBe(0);
    });

    it('computes totalPnL as realized + unrealized', () => {
      const trades: TradeForStats[] = [
        trade({ status: 'closed', pnl: 30 }),
        trade({ status: 'closed', pnl: -10 }),
      ];
      const snaps: SnapshotForStats[] = [
        { timestamp: day1, total_pnl: 0 },
      ];
      const result = computeStrategyStats(trades, snaps, 7.5, day1);
      expect(result.realizedPnL).toBe(20);
      expect(result.unrealizedPnL).toBe(7.5);
      expect(result.totalPnL).toBe(27.5);
    });

    it('flows snapshot-derived drawdown through unchanged', () => {
      const trades: TradeForStats[] = [];
      const snaps: SnapshotForStats[] = [
        { timestamp: day1, total_pnl: 100 },
        { timestamp: day2, total_pnl: 200 },
        { timestamp: day3, total_pnl: 150 },
      ];
      const result = computeStrategyStats(trades, snaps, 0, day1);
      expect(result.maxDrawdown).toBe(50);
      expect(result.currentDrawdown).toBe(50);
    });
  });
});

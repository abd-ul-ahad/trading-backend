import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/sequelize';
import { SchedulerRegistry } from '@nestjs/schedule';
import { StrategySyncService } from './strategy-sync.service';
import { Strategy } from '../../database/models/strategy.model';
import {
  Trade,
  TradeDirection,
  TradeStatus,
} from '../../database/models/trade.model';
import { StrategyPerformance } from '../../database/models/strategy-performance.model';
import { SyncCursor } from '../../database/models/sync-cursor.model';
import { TradingService } from '../trading/trading.service';
import { MetaApiConfigService } from '../../integrations/metaapi/metaapi-config.service';
import { Deal, Position } from '../../integrations/metaapi/interfaces';

interface MockTransaction {
  __mockTransaction: true;
}

describe('StrategySyncService', () => {
  let service: StrategySyncService;
  let strategyModel: { findAll: jest.Mock };
  let tradeModel: { bulkCreate: jest.Mock; findAll: jest.Mock };
  let strategyPerformanceModel: {
    findAll: jest.Mock;
    upsert: jest.Mock;
  };
  let syncCursorModel: { findByPk: jest.Mock; upsert: jest.Mock };
  let trading: {
    getHistoryDealsByTime: jest.Mock;
    getPositions: jest.Mock;
  };
  let sequelize: { transaction: jest.Mock; query: jest.Mock };
  let config: MetaApiConfigService;

  const ACCOUNT_ID = '11111111-1111-1111-1111-111111111111';
  const STRAT_A = '22222222-2222-2222-2222-222222222222';
  const STRAT_B = '33333333-3333-3333-3333-333333333333';

  const strat = (id: string, name = `Strat ${id.slice(0, 4)}`) =>
    ({ id, name, status: 'active' as const }) as unknown as Strategy;

  const deal = (overrides: Partial<Deal>): Deal => ({
    id: overrides.id ?? 'd-' + Math.random(),
    symbol: 'EURUSD',
    type: 'DEAL_TYPE_BUY',
    volume: 1,
    price: 1.1,
    profit: 0,
    time: '2024-04-20T12:00:00.000Z',
    ...overrides,
  });

  const pos = (overrides: Partial<Position>): Position => ({
    id: overrides.id ?? 'p-' + Math.random(),
    symbol: 'EURUSD',
    type: 'POSITION_TYPE_BUY',
    volume: 1,
    openPrice: 1.1,
    currentPrice: 1.11,
    profit: 10,
    swap: 0,
    ...overrides,
  });

  /** Capture the per-callback transaction object so we can assert it
   * gets forwarded to every query that touches the DB. */
  const txObject: MockTransaction = { __mockTransaction: true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrategySyncService,
        {
          provide: getConnectionToken(),
          useValue: {
            transaction: jest.fn(
              async (cb: (t: MockTransaction) => Promise<unknown>) =>
                cb(txObject),
            ),
            query: jest.fn(async () => [{ locked: true }]),
          },
        },
        {
          provide: getModelToken(Strategy),
          useValue: { findAll: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getModelToken(Trade),
          useValue: {
            bulkCreate: jest.fn().mockResolvedValue([]),
            findAll: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getModelToken(StrategyPerformance),
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            upsert: jest.fn().mockResolvedValue([{}, true]),
          },
        },
        {
          provide: getModelToken(SyncCursor),
          useValue: {
            findByPk: jest.fn().mockResolvedValue(null),
            upsert: jest.fn().mockResolvedValue([{}, true]),
          },
        },
        {
          provide: TradingService,
          useValue: {
            getHistoryDealsByTime: jest.fn().mockResolvedValue([]),
            getPositions: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: MetaApiConfigService,
          useValue: {
            accountId: ACCOUNT_ID,
            strategyCommentPrefix: 'STRAT:',
            strategyBackfillDays: 365,
            strategySyncOverlapMinutes: 60,
            strategySyncCron: '5 0 * * *',
          },
        },
        {
          provide: SchedulerRegistry,
          useValue: {
            doesExist: jest.fn().mockReturnValue(true),
            addCronJob: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(StrategySyncService);
    sequelize = module.get(getConnectionToken());
    strategyModel = module.get(getModelToken(Strategy));
    tradeModel = module.get(getModelToken(Trade));
    strategyPerformanceModel = module.get(getModelToken(StrategyPerformance));
    syncCursorModel = module.get(getModelToken(SyncCursor));
    trading = module.get(TradingService);
    config = module.get(MetaApiConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------
  // Pure helpers
  // -----------------------------------------------------------------
  describe('parseStratComment', () => {
    it('accepts STRAT:<uuid> with correct format', () => {
      expect(service.parseStratComment(`STRAT:${STRAT_A}`)).toBe(STRAT_A);
    });

    it('lowercases the returned uuid', () => {
      const upper = STRAT_A.toUpperCase();
      expect(service.parseStratComment(`STRAT:${upper}`)).toBe(STRAT_A);
    });

    it('accepts case-insensitive prefix', () => {
      expect(service.parseStratComment(`strat:${STRAT_A}`)).toBe(STRAT_A);
    });

    it('trims surrounding whitespace', () => {
      expect(service.parseStratComment(`  STRAT:${STRAT_A}  `)).toBe(STRAT_A);
    });

    it('respects a custom prefix from config', () => {
      (config as { strategyCommentPrefix: string }).strategyCommentPrefix =
        'MY-PREFIX:';
      expect(service.parseStratComment(`MY-PREFIX:${STRAT_A}`)).toBe(STRAT_A);
      expect(service.parseStratComment(`STRAT:${STRAT_A}`)).toBeNull();
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
      ['empty string', ''],
      ['just the prefix', 'STRAT:'],
      ['non-UUID payload', 'STRAT:abc'],
      ['unrelated prefix', `OTHER:${STRAT_A}`],
      ['no prefix', STRAT_A],
      ['trailing junk', `STRAT:${STRAT_A}-extra`],
    ])('rejects %s', (_label, input) => {
      expect(
        service.parseStratComment(input as string | null | undefined),
      ).toBeNull();
    });
  });

  describe('positionIdToTradeId', () => {
    it('is deterministic across calls', () => {
      const a = service.positionIdToTradeId(ACCOUNT_ID, '46214692');
      const b = service.positionIdToTradeId(ACCOUNT_ID, '46214692');
      expect(a).toBe(b);
    });

    it('produces a syntactically valid UUID', () => {
      const id = service.positionIdToTradeId(ACCOUNT_ID, '46214692');
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('differs across different positionIds', () => {
      const a = service.positionIdToTradeId(ACCOUNT_ID, '1');
      const b = service.positionIdToTradeId(ACCOUNT_ID, '2');
      expect(a).not.toBe(b);
    });

    it('differs across different accountIds', () => {
      const a = service.positionIdToTradeId(ACCOUNT_ID, '1');
      const b = service.positionIdToTradeId(
        '99999999-9999-9999-9999-999999999999',
        '1',
      );
      expect(a).not.toBe(b);
    });
  });

  // -----------------------------------------------------------------
  // Guard rails
  // -----------------------------------------------------------------
  describe('syncAll guard rails', () => {
    it('aborts with skippedReason=no_account_configured when accountId is undefined', async () => {
      (config as { accountId?: string }).accountId = undefined;

      const result = await service.syncAll();

      expect(result.skippedReason).toBe('no_account_configured');
      expect(result.accountId).toBeNull();
      expect(sequelize.transaction).not.toHaveBeenCalled();
      expect(trading.getHistoryDealsByTime).not.toHaveBeenCalled();
    });

    it('aborts with skippedReason=invalid_account_id when accountId is not a UUID', async () => {
      (config as { accountId?: string }).accountId = 'not-a-uuid';

      const result = await service.syncAll();

      expect(result.skippedReason).toBe('invalid_account_id');
      expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it('returns skippedReason=lock_held_by_other_replica when the advisory lock is held', async () => {
      sequelize.query.mockResolvedValueOnce([{ locked: false }]);

      const result = await service.syncAll();

      expect(result.skippedReason).toBe('lock_held_by_other_replica');
      expect(result.accountId).toBe(ACCOUNT_ID);
      expect(trading.getHistoryDealsByTime).not.toHaveBeenCalled();
      expect(strategyModel.findAll).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------
  // Attribution / bucketing
  // -----------------------------------------------------------------
  describe('attribution and bucketing', () => {
    it('splits skipped deals into dealsUntagged vs dealsUnknownStrategy', async () => {
      strategyModel.findAll.mockResolvedValue([strat(STRAT_A)]);
      trading.getHistoryDealsByTime.mockResolvedValue([
        deal({ comment: undefined, positionId: 'p1' }),
        deal({ comment: 'no-prefix', positionId: 'p2' }),
        deal({ comment: `STRAT:${STRAT_B}`, positionId: 'p3' }),
        deal({
          comment: `STRAT:${STRAT_A}`,
          positionId: 'p4',
          entryType: 'DEAL_ENTRY_IN',
        }),
      ]);
      trading.getPositions.mockResolvedValue([
        pos({ id: 'p4', comment: `STRAT:${STRAT_A}` }),
      ]);

      const result = await service.syncAll();

      expect(result.dealsFetched).toBe(4);
      expect(result.dealsAttributed).toBe(1);
      expect(result.dealsUntagged).toBe(2);
      expect(result.dealsUnknownStrategy).toBe(1);
    });

    it('buckets correctly when DB strategy ids are mixed-case', async () => {
      const upper = STRAT_A.toUpperCase();
      strategyModel.findAll.mockResolvedValue([strat(upper)]);
      trading.getHistoryDealsByTime.mockResolvedValue([
        deal({
          comment: `STRAT:${STRAT_A}`, // comment lower
          positionId: 'pos-mix',
          entryType: 'DEAL_ENTRY_IN',
        }),
      ]);
      trading.getPositions.mockResolvedValue([
        pos({ id: 'pos-mix', comment: `STRAT:${STRAT_A}` }),
      ]);

      const result = await service.syncAll();

      expect(result.dealsAttributed).toBe(1);
      expect(result.dealsUntagged).toBe(0);
      expect(result.dealsUnknownStrategy).toBe(0);
      expect(tradeModel.bulkCreate).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------
  // Trade pairing & bulk upsert
  // -----------------------------------------------------------------
  describe('trade pairing', () => {
    it('pairs 1 entry + 1 exit into one closed trade and bulk-upserts it', async () => {
      strategyModel.findAll.mockResolvedValue([strat(STRAT_A)]);
      trading.getHistoryDealsByTime.mockResolvedValue([
        deal({
          comment: `STRAT:${STRAT_A}`,
          positionId: 'pos-1',
          entryType: 'DEAL_ENTRY_IN',
          type: 'DEAL_TYPE_BUY',
          time: '2024-04-20T10:00:00.000Z',
          price: 1.1,
          volume: 1,
          profit: 0,
        }),
        deal({
          comment: `STRAT:${STRAT_A}`,
          positionId: 'pos-1',
          entryType: 'DEAL_ENTRY_OUT',
          type: 'DEAL_TYPE_SELL',
          time: '2024-04-20T14:00:00.000Z',
          price: 1.2,
          volume: 1,
          profit: 100,
        }),
      ]);
      trading.getPositions.mockResolvedValue([]);

      await service.syncAll();

      expect(tradeModel.bulkCreate).toHaveBeenCalledTimes(1);
      const [rows, opts] = tradeModel.bulkCreate.mock.calls[0];
      expect(rows).toHaveLength(1);
      const row = rows[0];
      expect(row.status).toBe(TradeStatus.CLOSED);
      expect(row.direction).toBe(TradeDirection.LONG);
      expect(row.entry_price).toBe(1.1);
      expect(row.exit_price).toBeCloseTo(1.2, 8);
      expect(row.pnl).toBe(100);
      expect(row.strategy_id).toBe(STRAT_A);
      expect(row.account_id).toBe(ACCOUNT_ID);
      expect(opts.updateOnDuplicate).toEqual(
        expect.arrayContaining([
          'strategy_id',
          'account_id',
          'symbol',
          'direction',
          'entry_time',
          'entry_price',
          'exit_time',
          'exit_price',
          'quantity',
          'pnl',
          'status',
        ]),
      );
      // last_updated must NOT be in updateOnDuplicate: the Postgres
      // trigger owns it.
      expect(opts.updateOnDuplicate).not.toContain('last_updated');
    });

    it('merges into an existing open trade row when the entry deal is outside the window', async () => {
      const positionId = 'pos-old-open';
      const tradeId = service.positionIdToTradeId(ACCOUNT_ID, positionId);
      const existing = {
        trade_id: tradeId,
        strategy_id: STRAT_A,
        account_id: ACCOUNT_ID,
        symbol: 'EURUSD',
        direction: TradeDirection.LONG,
        entry_time: new Date('2024-01-01T00:00:00.000Z'),
        entry_price: 1.0,
        exit_time: null,
        exit_price: null,
        quantity: 1,
        pnl: null,
        status: TradeStatus.OPEN,
        get: function () {
          return this;
        },
      };

      strategyModel.findAll.mockResolvedValue([strat(STRAT_A)]);
      tradeModel.findAll.mockResolvedValue([existing]);
      trading.getHistoryDealsByTime.mockResolvedValue([
        // Only the exit deal arrives this run; entry is from 4 months ago.
        deal({
          comment: `STRAT:${STRAT_A}`,
          positionId,
          entryType: 'DEAL_ENTRY_OUT',
          type: 'DEAL_TYPE_SELL',
          time: '2024-04-20T14:00:00.000Z',
          price: 1.5,
          volume: 1,
          profit: 500,
        }),
      ]);
      trading.getPositions.mockResolvedValue([]);

      await service.syncAll();

      expect(tradeModel.bulkCreate).toHaveBeenCalledTimes(1);
      const [rows] = tradeModel.bulkCreate.mock.calls[0];
      expect(rows).toHaveLength(1);
      const row = rows[0];
      expect(row.trade_id).toBe(tradeId);
      expect(row.status).toBe(TradeStatus.CLOSED);
      expect(row.entry_price).toBe(1.0);
      expect(row.entry_time).toEqual(existing.entry_time);
      expect(row.exit_price).toBeCloseTo(1.5, 8);
      expect(row.pnl).toBe(500);
    });

    it('emits an open trade when entry deal has a matching live position and no exit deal', async () => {
      strategyModel.findAll.mockResolvedValue([strat(STRAT_A)]);
      trading.getHistoryDealsByTime.mockResolvedValue([
        deal({
          comment: `STRAT:${STRAT_A}`,
          positionId: 'pos-open',
          entryType: 'DEAL_ENTRY_IN',
          type: 'DEAL_TYPE_SELL',
          time: '2024-04-20T10:00:00.000Z',
          price: 1.3,
          volume: 0.5,
        }),
      ]);
      trading.getPositions.mockResolvedValue([
        pos({
          id: 'pos-open',
          comment: `STRAT:${STRAT_A}`,
          type: 'POSITION_TYPE_SELL',
          profit: 25,
        }),
      ]);

      await service.syncAll();

      expect(tradeModel.bulkCreate).toHaveBeenCalledTimes(1);
      const row = tradeModel.bulkCreate.mock.calls[0][0][0];
      expect(row.status).toBe(TradeStatus.OPEN);
      expect(row.direction).toBe(TradeDirection.SHORT);
      expect(row.exit_time).toBeNull();
      expect(row.exit_price).toBeNull();
      expect(row.pnl).toBeNull();
    });

    it('does not call bulkCreate when no built trades are produced', async () => {
      strategyModel.findAll.mockResolvedValue([strat(STRAT_A)]);
      trading.getHistoryDealsByTime.mockResolvedValue([]);
      trading.getPositions.mockResolvedValue([]);

      await service.syncAll();

      expect(tradeModel.bulkCreate).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------
  // Snapshot upsert
  // -----------------------------------------------------------------
  describe('snapshot upsert', () => {
    it('upserts the snapshot with conflictFields=[strategy_id, snapshot_day]', async () => {
      strategyModel.findAll.mockResolvedValue([strat(STRAT_A)]);

      const result = await service.syncAll();

      expect(strategyPerformanceModel.upsert).toHaveBeenCalledTimes(1);
      const [values, opts] = strategyPerformanceModel.upsert.mock.calls[0];
      expect(values.strategy_id).toBe(STRAT_A);
      expect(values.account_id).toBe(ACCOUNT_ID);
      expect(values).not.toHaveProperty('last_updated');
      expect(values).not.toHaveProperty('snapshot_day');
      expect(opts.conflictFields).toEqual(['strategy_id', 'snapshot_day']);
      expect(result.perStrategy[0].snapshotWritten).toBe(true);
    });
  });

  // -----------------------------------------------------------------
  // Cursor logic
  // -----------------------------------------------------------------
  describe('cursor logic', () => {
    it('uses a backfill window on the first run when no cursor row exists', async () => {
      syncCursorModel.findByPk.mockResolvedValue(null);
      (config as { strategyBackfillDays: number }).strategyBackfillDays = 30;

      await service.syncAll();

      expect(trading.getHistoryDealsByTime).toHaveBeenCalledTimes(1);
      const [, start, end] =
        trading.getHistoryDealsByTime.mock.calls[0];
      const diffDays = (end.getTime() - start.getTime()) / 86400000;
      expect(diffDays).toBeCloseTo(30, 0);
    });

    it('uses (cursor - overlap → now) on subsequent runs', async () => {
      const lastDeal = new Date('2024-04-20T00:00:00.000Z');
      syncCursorModel.findByPk.mockResolvedValue({
        account_id: ACCOUNT_ID,
        last_deal_synced_at: lastDeal,
        last_run_at: lastDeal,
      });
      (config as {
        strategySyncOverlapMinutes: number;
      }).strategySyncOverlapMinutes = 60;

      await service.syncAll();

      const [, start] = trading.getHistoryDealsByTime.mock.calls[0];
      // start should be lastDeal - 60 minutes.
      const expected = new Date(lastDeal.getTime() - 60 * 60 * 1000);
      expect(start.getTime()).toBe(expected.getTime());
    });

    it('advances the cursor to the max deal.time on success', async () => {
      strategyModel.findAll.mockResolvedValue([strat(STRAT_A)]);
      const newest = '2024-04-25T18:00:00.000Z';
      trading.getHistoryDealsByTime.mockResolvedValue([
        deal({
          comment: `STRAT:${STRAT_A}`,
          positionId: 'p1',
          entryType: 'DEAL_ENTRY_IN',
          time: '2024-04-20T10:00:00.000Z',
        }),
        deal({
          comment: `STRAT:${STRAT_A}`,
          positionId: 'p1',
          entryType: 'DEAL_ENTRY_OUT',
          time: newest,
          profit: 5,
        }),
      ]);
      syncCursorModel.findByPk.mockResolvedValue(null);

      await service.syncAll();

      expect(syncCursorModel.upsert).toHaveBeenCalledTimes(1);
      const upsertArgs = syncCursorModel.upsert.mock.calls[0][0];
      expect(upsertArgs.account_id).toBe(ACCOUNT_ID);
      expect(upsertArgs.last_deal_synced_at.toISOString()).toBe(newest);
    });

    it('does not advance the cursor backwards', async () => {
      const cursorTime = new Date('2024-04-30T00:00:00.000Z');
      syncCursorModel.findByPk.mockResolvedValue({
        account_id: ACCOUNT_ID,
        last_deal_synced_at: cursorTime,
        last_run_at: cursorTime,
      });
      strategyModel.findAll.mockResolvedValue([strat(STRAT_A)]);
      // Only an older deal arrives this run.
      trading.getHistoryDealsByTime.mockResolvedValue([
        deal({
          comment: `STRAT:${STRAT_A}`,
          positionId: 'p1',
          entryType: 'DEAL_ENTRY_IN',
          time: '2024-04-10T00:00:00.000Z',
        }),
      ]);

      await service.syncAll();

      const upsertArgs = syncCursorModel.upsert.mock.calls[0][0];
      expect(upsertArgs.last_deal_synced_at.getTime()).toBe(
        cursorTime.getTime(),
      );
    });

    it('runBackfill uses the supplied window and does NOT touch the cursor', async () => {
      const from = new Date('2024-01-01T00:00:00.000Z');
      const to = new Date('2024-02-01T00:00:00.000Z');

      await service.runBackfill({ start: from, end: to });

      const [, start, end] = trading.getHistoryDealsByTime.mock.calls[0];
      expect(start).toEqual(from);
      expect(end).toEqual(to);
      expect(syncCursorModel.upsert).not.toHaveBeenCalled();
    });

    it('runBackfill rejects invalid windows', async () => {
      const same = new Date('2024-01-01T00:00:00.000Z');
      await expect(
        service.runBackfill({ start: same, end: same }),
      ).rejects.toThrow(/start < end/);

      await expect(
        service.runBackfill({
          start: new Date('not-a-date'),
          end: new Date(),
        }),
      ).rejects.toThrow(/valid Date instances/);
    });
  });

  // -----------------------------------------------------------------
  // Error isolation
  // -----------------------------------------------------------------
  describe('per-strategy error isolation', () => {
    it('records the failing strategy in perStrategy[].error but continues with the rest', async () => {
      strategyModel.findAll.mockResolvedValue([
        strat(STRAT_A, 'Bad'),
        strat(STRAT_B, 'Good'),
      ]);
      trading.getHistoryDealsByTime.mockResolvedValue([
        deal({
          comment: `STRAT:${STRAT_A}`,
          positionId: 'pa',
          entryType: 'DEAL_ENTRY_IN',
        }),
        deal({
          comment: `STRAT:${STRAT_A}`,
          positionId: 'pa',
          entryType: 'DEAL_ENTRY_OUT',
          time: '2024-04-20T14:00:00.000Z',
          profit: 10,
        }),
      ]);
      trading.getPositions.mockResolvedValue([]);

      tradeModel.bulkCreate
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValue([]);

      const result = await service.syncAll();

      expect(result.perStrategy).toHaveLength(2);
      const bad = result.perStrategy.find((p) => p.name === 'Bad')!;
      const good = result.perStrategy.find((p) => p.name === 'Good')!;
      expect(bad.error).toBe('boom');
      expect(bad.snapshotWritten).toBe(false);
      expect(good.error).toBeUndefined();
      expect(good.snapshotWritten).toBe(true);
    });

    it('a MetaApi fetch failure rolls back the transaction and bubbles up', async () => {
      trading.getHistoryDealsByTime.mockRejectedValue(
        new Error('metaapi down'),
      );

      await expect(service.syncAll()).rejects.toThrow('metaapi down');

      // No writes happened.
      expect(tradeModel.bulkCreate).not.toHaveBeenCalled();
      expect(strategyPerformanceModel.upsert).not.toHaveBeenCalled();
      expect(syncCursorModel.upsert).not.toHaveBeenCalled();
    });
  });
});

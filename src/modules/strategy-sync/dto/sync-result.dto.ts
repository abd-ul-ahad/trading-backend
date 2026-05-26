/**
 * Per-strategy outcome of a single sync run.
 *
 * One of these is returned for every active strategy the run touched (or
 * attempted to touch). When `error` is populated, `tradesUpserted` and
 * `snapshotWritten` will reflect work completed before the failure (which
 * may be zero).
 */
export class SyncStrategyResult {
  strategyId: string;
  name: string;
  /** Number of trade rows inserted-or-updated for this strategy. */
  tradesUpserted: number;
  /** Whether today's `strategy_performance` snapshot row was written. */
  snapshotWritten: boolean;
  /** Populated only if this strategy's sync threw. Other strategies still ran. */
  error?: string;
}

/**
 * Result of a single sync run (either the daily cron tick or a manual
 * `POST /strategy-sync/run` invocation).
 *
 * The "skipped deals" counter is split into two so operators can
 * distinguish a process bug from a config bug:
 *   - `dealsUntagged`: order had no recognisable comment prefix at all
 *     (likely a caller forgot to tag the order on placement).
 *   - `dealsUnknownStrategy`: order tagged with a UUID that doesn't
 *     match any active strategy (likely a strategy was deleted while
 *     orders were still in flight).
 *
 * `skippedReason` is non-null when the run aborted before fetching
 * anything (e.g. `METAAPI_ACCOUNT_ID` not configured, or a Postgres
 * advisory lock is held by another replica). When set, all numeric
 * counters will be zero.
 */
export class SyncRunResult {
  runAt: string;
  /** MetaApi account the run pulled from; null if the run was skipped. */
  accountId: string | null;
  dealsFetched: number;
  dealsAttributed: number;
  /** Deals with no recognisable strategy-comment prefix. */
  dealsUntagged: number;
  /** Deals tagged with a UUID that no active strategy matches. */
  dealsUnknownStrategy: number;
  strategiesProcessed: number;
  perStrategy: SyncStrategyResult[];
  /** Populated only when the run was aborted before doing any work. */
  skippedReason?: string;
}

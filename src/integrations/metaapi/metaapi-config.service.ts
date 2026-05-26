import { Injectable } from '@nestjs/common';

/**
 * Configuration service for MetaApi integration.
 *
 * Reads all required MetaApi environment variables at construction time
 * and exposes them as typed readonly properties. Throws immediately on
 * any missing variable so the application fails fast at startup.
 */
@Injectable()
export class MetaApiConfigService {
  readonly provisioningToken: string;
  readonly accountToken: string;
  readonly accountId?: string; // Optional - can be fetched dynamically from API
  readonly region: string;
  readonly provisioningBaseUrl: string;
  readonly tradingBaseUrl: string;

  /**
   * Order-comment prefix used by the strategy-sync pipeline to attribute
   * a MetaApi deal/position to a local Strategy row. Default `STRAT:`.
   * The full convention is `<prefix><lowercase-uuid>`.
   */
  readonly strategyCommentPrefix: string;

  /**
   * On the very first sync run for a given account (no `sync_cursors`
   * row yet), how far back to backfill MetaApi history. Defaults to
   * 365 days.
   */
  readonly strategyBackfillDays: number;

  /**
   * Overlap window applied on every incremental sync. The next run
   * queries deals from `(cursor.last_deal_synced_at - overlap)` to
   * `now` to absorb clock skew between the broker time and our wall
   * clock. Defaults to 1 hour.
   */
  readonly strategySyncOverlapMinutes: number;

  /**
   * Cron expression for the daily strategy-sync. Defaults to `5 0 * * *`
   * (00:05 UTC every day). Time zone is always UTC; do not include a
   * second-precision field.
   */
  readonly strategySyncCron: string;

  constructor() {
    this.provisioningToken = this.require('METAAPI_PROVISIONING_TOKEN');
    this.accountToken = this.require('METAAPI_ACCOUNT_TOKEN');
    this.accountId = process.env.METAAPI_ACCOUNT_ID; // Optional
    this.region = this.require('METAAPI_REGION');
    this.provisioningBaseUrl = this.require('METAAPI_PROVISIONING_BASE_URL');
    this.tradingBaseUrl = this.require('METAAPI_TRADING_BASE_URL');

    this.strategyCommentPrefix =
      process.env.STRATEGY_COMMENT_PREFIX ?? 'STRAT:';
    this.strategyBackfillDays = this.parsePositiveInt(
      process.env.STRATEGY_BACKFILL_DAYS,
      365,
      'STRATEGY_BACKFILL_DAYS',
    );
    this.strategySyncOverlapMinutes = this.parsePositiveInt(
      process.env.STRATEGY_SYNC_OVERLAP_MINUTES,
      60,
      'STRATEGY_SYNC_OVERLAP_MINUTES',
    );
    this.strategySyncCron =
      process.env.STRATEGY_SYNC_CRON ?? '5 0 * * *';
  }

  private require(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`${name} environment variable is required`);
    }
    return value;
  }

  private parsePositiveInt(
    raw: string | undefined,
    fallback: number,
    name: string,
  ): number {
    if (raw === undefined || raw === '') return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
      throw new Error(
        `${name} must be a positive integer (got "${raw}")`,
      );
    }
    return n;
  }
}

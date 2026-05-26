import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import { BackfillRequestDto } from './dto/backfill-request.dto';
import { SyncRunResult } from './dto/sync-result.dto';
import { StrategySyncService } from './strategy-sync.service';

/**
 * Manual triggers for the daily MetaApi → strategy sync pipeline.
 *
 * Mounted at `/strategy-sync/*` (instead of folded into `/strategies`)
 * so the sync surface is grep-able and discoverable: anything to do
 * with the sync pipeline lives under one route prefix and one
 * controller, separate from the `StrategyController` CRUD surface.
 *
 * The service holds a Postgres advisory lock for the duration of every
 * run, so calling these endpoints concurrently with the cron (or each
 * other) is safe — the second caller gets back a
 * `skippedReason: "lock_held_by_other_replica"` result without touching
 * MetaApi or the database.
 *
 * Endpoints always return HTTP 200 — including when the run was
 * skipped. Operators distinguish "ran" vs "skipped" via the response
 * body's `skippedReason` field.
 */
@Controller('strategy-sync')
export class StrategySyncController {
  constructor(private readonly strategySyncService: StrategySyncService) {}

  /**
   * Trigger an incremental sync immediately. Uses the per-account
   * cursor to decide how far back to fetch; advances the cursor on
   * success.
   */
  @Post('run')
  @HttpCode(200)
  async run(): Promise<SyncRunResult> {
    return this.strategySyncService.syncAll();
  }

  /**
   * Re-pull a fixed historical window without touching the cursor.
   * Use after fixing a misconfigured `STRAT:<uuid>` comment on past
   * orders, or to backfill a strategy after migrating it to the
   * sync pipeline.
   *
   * Body: `{ "from": "2026-01-01T00:00:00.000Z", "to": "2026-02-01T00:00:00.000Z" }`.
   */
  @Post('backfill')
  @HttpCode(200)
  async backfill(@Body() body: BackfillRequestDto): Promise<SyncRunResult> {
    const start = new Date(body.from);
    const end = new Date(body.to);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException(
        'from/to must be ISO-8601 timestamps',
      );
    }
    if (start >= end) {
      throw new BadRequestException('from must be strictly before to');
    }
    return this.strategySyncService.runBackfill({ start, end });
  }
}

import { IsISO8601 } from 'class-validator';

/**
 * Request body for `POST /strategy-sync/backfill`.
 *
 * Defines the historical window the operator wants re-pulled from
 * MetaApi. The controller additionally validates that `from < to`;
 * this DTO only covers the per-field shape (both must be ISO-8601
 * timestamps).
 */
export class BackfillRequestDto {
  /** Inclusive lower bound of the deal-fetch window (ISO-8601). */
  @IsISO8601()
  from!: string;

  /** Exclusive upper bound of the deal-fetch window (ISO-8601). */
  @IsISO8601()
  to!: string;
}

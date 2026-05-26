import {
  Table,
  Column,
  DataType,
  PrimaryKey,
  Model,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

/**
 * SyncCursor — per-MetaApi-account high-water-mark for the
 * strategy-sync pipeline.
 *
 * Each sync run updates `last_deal_synced_at` to the maximum `deal.time`
 * it has successfully ingested. The next run pulls deals strictly after
 * (`last_deal_synced_at` minus a small overlap window to absorb clock
 * skew between the MetaApi broker time and our wall clock). This
 * replaces the previous "rolling 30-day window" approach, which
 * silently dropped any position whose entry deal was older than 30 days
 * when its closing deal eventually arrived.
 *
 * Extends Model directly (not BaseModel) because the primary key is
 * `account_id`, not a synthetic UUID.
 */
@Table({
  tableName: 'sync_cursors',
  timestamps: true,
  paranoid: false,
  underscored: true,
})
export class SyncCursor extends Model {
  /**
   * MetaApi account this cursor is for. One cursor per account.
   */
  @PrimaryKey
  @Column({ type: DataType.UUID, allowNull: false })
  declare account_id: string;

  /**
   * Maximum `deal.time` we have successfully processed for this account.
   * Used as the lower bound on the next sync's MetaApi history query.
   */
  @Column({ type: DataType.DATE, allowNull: false })
  declare last_deal_synced_at: Date;

  /**
   * Wall-clock time of the most recent sync run. Useful for monitoring
   * and operator dashboards; not part of the deal-attribution logic.
   */
  @Column({ type: DataType.DATE, allowNull: false })
  declare last_run_at: Date;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}

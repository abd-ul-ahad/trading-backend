import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TradingModule } from '../trading/trading.module';
import { MetaApiHttpModule } from '../../integrations/metaapi/metaapi-http.module';
import { Strategy } from '../../database/models/strategy.model';
import { Trade } from '../../database/models/trade.model';
import { StrategyPerformance } from '../../database/models/strategy-performance.model';
import { SyncCursor } from '../../database/models/sync-cursor.model';
import { StrategySyncService } from './strategy-sync.service';
import { StrategySyncController } from './strategy-sync.controller';

/**
 * StrategySyncModule wires the @nestjs/schedule cron, its manual
 * trigger endpoints, and the per-account sync cursor into the
 * application.
 *
 * Dependency notes:
 *   - `TradingModule` is imported to inject `TradingService`, which
 *     already encapsulates MetaApi auth headers and error handling.
 *   - `MetaApiHttpModule` is imported separately so `MetaApiConfigService`
 *     resolves; it's re-exported by `TradingModule` too, but importing
 *     directly keeps the dependency explicit and survives future
 *     refactors of `TradingModule`.
 *   - `SequelizeModule.forFeature([...])` covers every table the sync
 *     touches: `strategies` (read), `trades` (bulk-upsert),
 *     `strategy_performance` (upsert), `sync_cursors` (read+upsert).
 *     We do NOT touch `real_time_strategies` directly — a Postgres
 *     trigger on `strategy_performance` mirrors our writes there.
 */
@Module({
  imports: [
    TradingModule,
    MetaApiHttpModule,
    SequelizeModule.forFeature([
      Strategy,
      Trade,
      StrategyPerformance,
      SyncCursor,
    ]),
  ],
  controllers: [StrategySyncController],
  providers: [StrategySyncService],
  exports: [StrategySyncService],
})
export class StrategySyncModule {}

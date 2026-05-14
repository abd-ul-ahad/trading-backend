import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MetaApiHttpModule } from '../../integrations/metaapi/metaapi-http.module';
import { TradingService } from './trading.service';
import { AnalyticsService } from './analytics.service';
import { TradingController } from './trading.controller';
import { RealTimeTrade } from '../../database/models/real-time-trade.model';
import { AccountPerformance } from '../../database/models/account-performance.model';
import { StrategyPerformance } from '../../database/models/strategy-performance.model';

@Module({
  imports: [
    MetaApiHttpModule,
    SequelizeModule.forFeature([
      RealTimeTrade,
      AccountPerformance,
      StrategyPerformance,
    ]),
  ],
  controllers: [TradingController],
  providers: [TradingService, AnalyticsService],
  exports: [TradingService, AnalyticsService],
})
export class TradingModule {}

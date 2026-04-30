import { Module } from '@nestjs/common';
import { MetaApiHttpModule } from '../../integrations/metaapi/metaapi-http.module';
import { TradingService } from './trading.service';
import { TradingController } from './trading.controller';

@Module({
  imports: [MetaApiHttpModule],
  controllers: [TradingController],
  providers: [TradingService],
  exports: [TradingService],
})
export class TradingModule {}

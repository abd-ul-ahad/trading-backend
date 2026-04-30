import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MetaApiConfigService } from './metaapi-config.service';

@Module({
  imports: [HttpModule.register({ timeout: 30000 })],
  providers: [MetaApiConfigService],
  exports: [HttpModule, MetaApiConfigService],
})
export class MetaApiHttpModule {}

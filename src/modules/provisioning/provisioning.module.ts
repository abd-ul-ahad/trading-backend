import { Module } from '@nestjs/common';
import { MetaApiHttpModule } from '../../integrations/metaapi/metaapi-http.module';
import { ProvisioningService } from './provisioning.service';
import { ProvisioningController } from './provisioning.controller';

@Module({
  imports: [MetaApiHttpModule],
  controllers: [ProvisioningController],
  providers: [ProvisioningService],
  exports: [ProvisioningService],
})
export class ProvisioningModule {}

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BrokerAccountsService } from './broker-accounts.service';
import { BrokerAccountsController } from './broker-accounts.controller';
import { BrokerAccount } from '../../database/models/broker-account.model';

@Module({
  imports: [SequelizeModule.forFeature([BrokerAccount])],
  controllers: [BrokerAccountsController],
  providers: [BrokerAccountsService],
  exports: [BrokerAccountsService],
})
export class BrokerAccountsModule {}

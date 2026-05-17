import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { UserStrategySubscription } from '../../database/models/user-strategy-subscription.model';
import { Strategy } from '../../database/models/strategy.model';
import { BrokerAccount } from '../../database/models/broker-account.model';
import { StrategiesModule } from '../strategies/strategies.module';

@Module({
  imports: [
    SequelizeModule.forFeature([UserStrategySubscription, Strategy, BrokerAccount]),
    StrategiesModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

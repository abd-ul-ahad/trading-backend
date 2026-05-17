import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ProvisioningModule } from './modules/provisioning/provisioning.module';
import { TradingModule } from './modules/trading/trading.module';
import { UsersModule } from './modules/users/users.module';
import { StrategiesModule } from './modules/strategies/strategies.module';
import { BrokerAccountsModule } from './modules/broker-accounts/broker-accounts.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    ProvisioningModule,
    TradingModule,
    UsersModule,
    StrategiesModule,
    BrokerAccountsModule,
    SubscriptionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

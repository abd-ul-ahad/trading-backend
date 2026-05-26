import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ProvisioningModule } from './modules/provisioning/provisioning.module';
import { TradingModule } from './modules/trading/trading.module';
import { StrategyModule } from './modules/strategy/strategy.module';
import { StrategySyncModule } from './modules/strategy-sync/strategy-sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    ProvisioningModule,
    TradingModule,
    StrategyModule,
    StrategySyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

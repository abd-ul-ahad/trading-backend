import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StrategyService } from './strategy.service';
import { StrategyController } from './strategy.controller';
import { Strategy } from '../../database/models/strategy.model';
import { Trade } from '../../database/models/trade.model';
import { StrategyPerformance } from '../../database/models/strategy-performance.model';
import { RealTimeStrategy } from '../../database/models/real-time-strategy.model';
import { RealTimeTrade } from '../../database/models/real-time-trade.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Strategy,
      Trade,
      StrategyPerformance,
      RealTimeStrategy,
      RealTimeTrade,
    ]),
  ],
  controllers: [StrategyController],
  providers: [StrategyService],
  exports: [StrategyService],
})
export class StrategyModule {}

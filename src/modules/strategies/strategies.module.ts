import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StrategiesService } from './strategies.service';
import { StrategiesController } from './strategies.controller';
import { Strategy } from '../../database/models/strategy.model';

@Module({
  imports: [SequelizeModule.forFeature([Strategy])],
  controllers: [StrategiesController],
  providers: [StrategiesService],
  exports: [StrategiesService],
})
export class StrategiesModule {}

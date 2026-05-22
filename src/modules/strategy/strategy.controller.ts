import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { CreateStrategyDto, UpdateStrategyDto } from './dto';
import { StrategyResponseDto } from './dto/strategy-response.dto';
import { StrategyPerformanceDto } from './dto/strategy-performance.dto';
import { PublicStrategySummaryDto } from './dto/public-strategy-summary.dto';
import { EquityCurvePointDto } from './dto/equity-curve.dto';
import { Strategy } from '../../database/models/strategy.model';
import { Trade } from '../../database/models/trade.model';
@Controller('strategies')
export class StrategyController {
  constructor(private readonly strategyService: StrategyService) {}

  // ==================== Strategy Management Endpoints ====================

  @Post()
  async create(@Body() dto: CreateStrategyDto): Promise<Strategy> {
    return this.strategyService.create(dto);
  }

  @Get()
  async findAll(): Promise<Strategy[]> {
    return this.strategyService.findAll();
  }

  @Get('account/:accountId')
  async findByAccountId(
    @Param('accountId') accountId: string,
  ): Promise<Strategy[]> {
    return this.strategyService.findByAccountId(accountId);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Strategy> {
    return this.strategyService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStrategyDto,
  ): Promise<Strategy> {
    return this.strategyService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.strategyService.delete(id);
  }

  // ==================== Strategy Performance Endpoints ====================

  @Get(':id/performance')
  async getPerformance(
    @Param('id') id: string,
  ): Promise<StrategyPerformanceDto> {
    return this.strategyService.getPerformance(id);
  }

  @Get(':id/trades')
  async getTrades(
    @Param('id') id: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
    @Query('status') status?: string,
  ): Promise<{ trades: Trade[]; total: number }> {
    return this.strategyService.getTrades(
      id,
      parseInt(limit),
      parseInt(offset),
      status,
    );
  }

  @Get(':id/equity-curve')
  async getEquityCurve(
    @Param('id') id: string,
    @Query('days') days: string = '30',
  ): Promise<EquityCurvePointDto[]> {
    return this.strategyService.getEquityCurve(id, parseInt(days));
  }

  // ==================== Public Strategy Endpoints ====================

  @Get('public/:id/summary')
  async getPublicSummary(
    @Param('id') id: string,
  ): Promise<PublicStrategySummaryDto> {
    return this.strategyService.getPublicSummary(id);
  }
}

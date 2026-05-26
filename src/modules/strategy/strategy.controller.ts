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
import { SeedResultDto } from './dto/seed-result.dto';
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

  // ==================== Dev / Seed Endpoints ====================

  /**
   * Seed deterministic demo data.
   *
   * Wipes every existing strategy (and its snapshots, trades, and
   * real-time mirror rows) and creates exactly 10 fresh strategies
   * named `Strategy 1`..`Strategy 10`, each with a 10-day pnl series
   * and a varied trade ledger.
   *
   * **Destructive in every environment, including production.** The
   * endpoint is intentionally left enabled in prod so demo datasets
   * can be re-seeded on the live deployment. Concurrency is the only
   * safety concern; the service serialises the call through the same
   * Postgres advisory lock the strategy-sync cron uses, so a second
   * seed press, or the 00:05 UTC sync firing mid-seed, returns 409
   * instead of corrupting the dataset.
   *
   * Optional body: `{ "dayOne": "YYYY-MM-DD" }` to override the day-1
   * anchor (defaults to `2024-04-20`).
   */
  @Post('dev/seed')
  async seedDevData(
    @Body() body?: { dayOne?: string },
  ): Promise<SeedResultDto[]> {
    return this.strategyService.seedDevData(body?.dayOne);
  }
}

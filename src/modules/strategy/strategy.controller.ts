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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { StrategyService } from './strategy.service';
import { CreateStrategyDto, UpdateStrategyDto } from './dto';
import { StrategyResponseDto } from './dto/strategy-response.dto';
import { StrategyPerformanceDto } from './dto/strategy-performance.dto';
import { PublicStrategySummaryDto } from './dto/public-strategy-summary.dto';
import { EquityCurvePointDto } from './dto/equity-curve.dto';
import { Strategy } from '../../database/models/strategy.model';
import { Trade } from '../../database/models/trade.model';

@ApiTags('Strategies')
@Controller('strategies')
export class StrategyController {
  constructor(private readonly strategyService: StrategyService) {}

  // ==================== Strategy Management Endpoints ====================

  @Post()
  @ApiOperation({ summary: 'Create a new strategy' })
  @ApiBody({
    type: CreateStrategyDto,
    description: 'Strategy creation parameters',
  })
  @ApiResponse({
    status: 201,
    description: 'Strategy created successfully',
    type: StrategyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input parameters',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() dto: CreateStrategyDto): Promise<Strategy> {
    return this.strategyService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all strategies' })
  @ApiResponse({
    status: 200,
    description: 'Strategies retrieved successfully',
    type: [StrategyResponseDto],
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(): Promise<Strategy[]> {
    return this.strategyService.findAll();
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Get strategies by account ID' })
  @ApiParam({
    name: 'accountId',
    description: 'Account ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Strategies retrieved successfully',
    type: [StrategyResponseDto],
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findByAccountId(@Param('accountId') accountId: string): Promise<Strategy[]> {
    return this.strategyService.findByAccountId(accountId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a strategy by ID' })
  @ApiParam({
    name: 'id',
    description: 'Strategy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Strategy retrieved successfully',
    type: StrategyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findById(@Param('id') id: string): Promise<Strategy> {
    return this.strategyService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a strategy' })
  @ApiParam({
    name: 'id',
    description: 'Strategy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateStrategyDto,
    description: 'Strategy update parameters',
  })
  @ApiResponse({
    status: 200,
    description: 'Strategy updated successfully',
    type: StrategyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStrategyDto,
  ): Promise<Strategy> {
    return this.strategyService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a strategy' })
  @ApiParam({
    name: 'id',
    description: 'Strategy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Strategy deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.strategyService.delete(id);
  }

  // ==================== Strategy Performance Endpoints ====================

  @Get(':id/performance')
  @ApiOperation({ summary: 'Get live performance for a strategy' })
  @ApiParam({
    name: 'id',
    description: 'Strategy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance retrieved successfully',
    type: StrategyPerformanceDto,
  })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPerformance(@Param('id') id: string): Promise<StrategyPerformanceDto> {
    return this.strategyService.getPerformance(id);
  }

  @Get(':id/trades')
  @ApiOperation({ summary: 'Get all trades for a strategy' })
  @ApiParam({
    name: 'id',
    description: 'Strategy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of trades to return',
    example: 50,
    required: false,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of trades to skip',
    example: 0,
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by trade status',
    enum: ['open', 'closed', 'cancelled'],
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Trades retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTrades(
    @Param('id') id: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
    @Query('status') status?: string,
  ): Promise<{ trades: Trade[]; total: number }> {
    return this.strategyService.getTrades(id, parseInt(limit), parseInt(offset), status);
  }

  @Get(':id/equity-curve')
  @ApiOperation({ summary: 'Get equity curve for a strategy' })
  @ApiParam({
    name: 'id',
    description: 'Strategy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'days',
    description: 'Number of days to retrieve',
    example: 30,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Equity curve retrieved successfully',
    type: [EquityCurvePointDto],
  })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getEquityCurve(
    @Param('id') id: string,
    @Query('days') days: string = '30',
  ): Promise<EquityCurvePointDto[]> {
    return this.strategyService.getEquityCurve(id, parseInt(days));
  }

  // ==================== Public Strategy Endpoints ====================

  @Get('public/:id/summary')
  @ApiOperation({ summary: 'Get public strategy summary (no capital info)' })
  @ApiParam({
    name: 'id',
    description: 'Strategy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Public summary retrieved successfully',
    type: PublicStrategySummaryDto,
  })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPublicSummary(@Param('id') id: string): Promise<PublicStrategySummaryDto> {
    return this.strategyService.getPublicSummary(id);
  }
}

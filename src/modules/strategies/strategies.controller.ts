import { Body, Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { StrategiesService } from './strategies.service';
import { CreateStrategyDto } from './dto';
import { Strategy } from '../../database/models/strategy.model';

@ApiTags('Strategies')
@Controller('strategies')
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new strategy' })
  @ApiResponse({
    status: 201,
    description: 'Strategy created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  async createStrategy(
    @Body() createStrategyDto: CreateStrategyDto,
    @Query('userId') userId: string,
  ): Promise<Strategy> {
    return this.strategiesService.createStrategy(userId, createStrategyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all strategies' })
  @ApiQuery({
    name: 'status',
    description: 'Filter by status (active, inactive, archived)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Strategies retrieved successfully',
  })
  async getAllStrategies(@Query('status') status?: string): Promise<Strategy[]> {
    return this.strategiesService.getAllStrategies(status);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active strategies' })
  @ApiResponse({
    status: 200,
    description: 'Active strategies retrieved successfully',
  })
  async getActiveStrategies(): Promise<Strategy[]> {
    return this.strategiesService.getActiveStrategies();
  }

  @Get(':strategyId')
  @ApiOperation({ summary: 'Get strategy by ID' })
  @ApiParam({
    name: 'strategyId',
    description: 'Strategy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Strategy retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Strategy not found',
  })
  async getStrategyById(@Param('strategyId') strategyId: string): Promise<Strategy> {
    return this.strategiesService.getStrategyById(strategyId);
  }
}

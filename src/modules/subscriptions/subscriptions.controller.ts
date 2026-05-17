import { Body, Controller, Get, Post, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { SubscribeStrategyDto } from './dto';
import { UserStrategySubscription } from '../../database/models/user-strategy-subscription.model';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to a strategy' })
  @ApiResponse({
    status: 201,
    description: 'Successfully subscribed to strategy',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or subscription error',
  })
  async subscribeToStrategy(
    @Body() subscribeDto: SubscribeStrategyDto,
    @Query('userId') userId: string,
  ): Promise<UserStrategySubscription> {
    return this.subscriptionsService.subscribeToStrategy(userId, subscribeDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all subscriptions for a user' })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User subscriptions retrieved successfully',
  })
  async getUserSubscriptions(@Param('userId') userId: string): Promise<UserStrategySubscription[]> {
    return this.subscriptionsService.getUserSubscriptions(userId);
  }

  @Get('strategy/:strategyId/subscribers')
  @ApiOperation({ summary: 'Get all active subscribers for a strategy' })
  @ApiParam({
    name: 'strategyId',
    description: 'Strategy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Strategy subscribers retrieved successfully',
  })
  async getStrategySubscribers(@Param('strategyId') strategyId: string): Promise<UserStrategySubscription[]> {
    return this.subscriptionsService.getStrategySubscribers(strategyId);
  }

  @Get(':subscriptionId')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiParam({
    name: 'subscriptionId',
    description: 'Subscription ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription not found',
  })
  async getSubscriptionById(@Param('subscriptionId') subscriptionId: string): Promise<UserStrategySubscription> {
    return this.subscriptionsService.getSubscriptionById(subscriptionId);
  }

  @Delete(':subscriptionId')
  @ApiOperation({ summary: 'Unsubscribe from a strategy' })
  @ApiParam({
    name: 'subscriptionId',
    description: 'Subscription ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully unsubscribed from strategy',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription not found',
  })
  async unsubscribeFromStrategy(@Param('subscriptionId') subscriptionId: string): Promise<UserStrategySubscription> {
    return this.subscriptionsService.unsubscribeFromStrategy(subscriptionId);
  }
}

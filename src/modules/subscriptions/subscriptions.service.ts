import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserStrategySubscription } from '../../database/models/user-strategy-subscription.model';
import { Strategy } from '../../database/models/strategy.model';
import { BrokerAccount } from '../../database/models/broker-account.model';
import { SubscribeStrategyDto } from './dto';
import { StrategiesService } from '../strategies/strategies.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel(UserStrategySubscription)
    private readonly subscriptionModel: typeof UserStrategySubscription,
    @InjectModel(Strategy)
    private readonly strategyModel: typeof Strategy,
    @InjectModel(BrokerAccount)
    private readonly brokerAccountModel: typeof BrokerAccount,
    private readonly strategiesService: StrategiesService,
  ) {}

  async subscribeToStrategy(userId: string, subscribeDto: SubscribeStrategyDto): Promise<UserStrategySubscription> {
    // Verify strategy exists and is active
    const strategy = await this.strategyModel.findByPk(subscribeDto.strategyId);

    if (!strategy || strategy.status !== 'active') {
      throw new BadRequestException('Strategy not found or not active');
    }

    // Verify minimum investment
    if (subscribeDto.initialInvestment < strategy.minimumInvestment) {
      throw new BadRequestException(
        `Minimum investment is ${strategy.minimumInvestment}, got ${subscribeDto.initialInvestment}`,
      );
    }

    // Verify broker account exists and belongs to user
    const brokerAccount = await this.brokerAccountModel.findOne({
      where: {
        id: subscribeDto.brokerAccountId,
        userId,
      },
    });

    if (!brokerAccount) {
      throw new BadRequestException('Broker account not found or does not belong to user');
    }

    // Check if already subscribed
    const existingSubscription = await this.subscriptionModel.findOne({
      where: {
        userId,
        strategyId: subscribeDto.strategyId,
        brokerAccountId: subscribeDto.brokerAccountId,
      },
    });

    if (existingSubscription && existingSubscription.status !== 'inactive') {
      throw new BadRequestException('Already subscribed to this strategy with this account');
    }

    // Create subscription
    const subscription = await this.subscriptionModel.create({
      userId,
      strategyId: subscribeDto.strategyId,
      brokerAccountId: subscribeDto.brokerAccountId,
      initialInvestment: subscribeDto.initialInvestment,
      currentValue: subscribeDto.initialInvestment,
      status: 'active',
    });

    // Increment strategy subscriber count
    await this.strategiesService.incrementSubscriberCount(subscribeDto.strategyId);

    this.logger.log(`User ${userId} subscribed to strategy ${subscribeDto.strategyId}`);

    return subscription;
  }

  async getSubscriptionById(subscriptionId: string): Promise<UserStrategySubscription> {
    const subscription = await this.subscriptionModel.findByPk(subscriptionId, {
      include: [
        { model: Strategy },
        { model: BrokerAccount },
      ],
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    return subscription;
  }

  async getUserSubscriptions(userId: string): Promise<UserStrategySubscription[]> {
    return this.subscriptionModel.findAll({
      where: { userId },
      include: [
        { model: Strategy },
        { model: BrokerAccount },
      ],
      order: [['subscribedAt', 'DESC']],
    });
  }

  async getStrategySubscribers(strategyId: string): Promise<UserStrategySubscription[]> {
    return this.subscriptionModel.findAll({
      where: {
        strategyId,
        status: 'active',
      },
      include: [{ model: BrokerAccount }],
    });
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    status: 'active' | 'paused' | 'inactive' | 'error',
    errorMessage?: string,
  ): Promise<UserStrategySubscription> {
    const subscription = await this.getSubscriptionById(subscriptionId);

    const previousStatus = subscription.status;

    await subscription.update({
      status,
      errorMessage: errorMessage || null,
      unsubscribedAt: status === 'inactive' ? new Date() : null,
    });

    // Update strategy subscriber count
    if (previousStatus === 'active' && status !== 'active') {
      await this.strategiesService.decrementSubscriberCount(subscription.strategyId);
    } else if (previousStatus !== 'active' && status === 'active') {
      await this.strategiesService.incrementSubscriberCount(subscription.strategyId);
    }

    this.logger.log(`Subscription ${subscriptionId} status updated to ${status}`);

    return subscription;
  }

  async updateSubscriptionPerformance(
    subscriptionId: string,
    performance: {
      currentValue?: number;
      realizedPnL?: number;
      unrealizedPnL?: number;
      returnPercent?: number;
      tradesCopied?: number;
    },
  ): Promise<UserStrategySubscription> {
    const subscription = await this.getSubscriptionById(subscriptionId);

    await subscription.update(performance);

    return subscription;
  }

  async unsubscribeFromStrategy(subscriptionId: string): Promise<UserStrategySubscription> {
    return this.updateSubscriptionStatus(subscriptionId, 'inactive');
  }
}

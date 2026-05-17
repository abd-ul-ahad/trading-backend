import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Strategy } from '../../database/models/strategy.model';
import { CreateStrategyDto } from './dto';

@Injectable()
export class StrategiesService {
  private readonly logger = new Logger(StrategiesService.name);

  constructor(
    @InjectModel(Strategy)
    private readonly strategyModel: typeof Strategy,
  ) {}

  async createStrategy(createdByUserId: string, createStrategyDto: CreateStrategyDto): Promise<Strategy> {
    const strategy = await this.strategyModel.create({
      ...createStrategyDto,
      createdByUserId,
      status: 'active',
    });

    this.logger.log(`Strategy created: ${strategy.id} by user ${createdByUserId}`);

    return strategy;
  }

  async getStrategyById(strategyId: string): Promise<Strategy> {
    const strategy = await this.strategyModel.findByPk(strategyId);

    if (!strategy) {
      throw new BadRequestException('Strategy not found');
    }

    return strategy;
  }

  async getAllStrategies(status?: string): Promise<Strategy[]> {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    return this.strategyModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  async getActiveStrategies(): Promise<Strategy[]> {
    return this.strategyModel.findAll({
      where: { status: 'active' },
      order: [['subscriberCount', 'DESC']],
    });
  }

  async updateStrategyMetrics(
    strategyId: string,
    metrics: {
      totalReturn?: number;
      winRate?: number;
      maxDrawdown?: number;
      avgTradeDuration?: number;
    },
  ): Promise<Strategy> {
    const strategy = await this.getStrategyById(strategyId);

    await strategy.update(metrics);

    this.logger.log(`Strategy metrics updated: ${strategyId}`);

    return strategy;
  }

  async incrementSubscriberCount(strategyId: string): Promise<void> {
    const strategy = await this.getStrategyById(strategyId);

    await strategy.increment('subscriberCount');

    this.logger.log(`Strategy subscriber count incremented: ${strategyId}`);
  }

  async decrementSubscriberCount(strategyId: string): Promise<void> {
    const strategy = await this.getStrategyById(strategyId);

    await strategy.decrement('subscriberCount');

    this.logger.log(`Strategy subscriber count decremented: ${strategyId}`);
  }

  async updateStrategyStatus(strategyId: string, status: 'active' | 'inactive' | 'archived'): Promise<Strategy> {
    const strategy = await this.getStrategyById(strategyId);

    await strategy.update({ status });

    this.logger.log(`Strategy status updated: ${strategyId} -> ${status}`);

    return strategy;
  }
}

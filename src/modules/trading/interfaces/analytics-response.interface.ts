import { ApiProperty } from '@nestjs/swagger';

export class PeriodInfo {
  @ApiProperty({
    description: 'Start date of the analytics period',
    example: '2024-04-01T00:00:00.000Z',
  })
  startDate: string;

  @ApiProperty({
    description: 'End date of the analytics period',
    example: '2024-05-06T23:59:59.999Z',
  })
  endDate: string;
}

export class TradeStatistics {
  @ApiProperty({
    description: 'Total number of trades in the period',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Number of winning trades',
    example: 90,
  })
  winning: number;

  @ApiProperty({
    description: 'Number of losing trades',
    example: 60,
  })
  losing: number;

  @ApiProperty({
    description: 'Win rate as a decimal (0 to 1)',
    example: 0.6,
  })
  winRate: number;
}

export class ReturnMetrics {
  @ApiProperty({
    description: 'Realized profit/loss from closed positions',
    example: 5420.5,
  })
  realizedPnL: number;

  @ApiProperty({
    description: 'Unrealized profit/loss from open positions',
    example: 1250.3,
  })
  unrealizedPnL: number;

  @ApiProperty({
    description: 'Total profit/loss (realized + unrealized)',
    example: 6670.8,
  })
  totalPnL: number;

  @ApiProperty({
    description: 'Realized return as a percentage',
    example: 5.42,
  })
  realizedReturnPercent: number;

  @ApiProperty({
    description: 'Unrealized return as a percentage',
    example: 1.25,
  })
  unrealizedReturnPercent: number;
}

export class DrawdownMetrics {
  @ApiProperty({
    description: 'Maximum drawdown percentage in the period',
    example: -8.5,
  })
  maxDrawdown: number;

  @ApiProperty({
    description: 'Current drawdown percentage',
    example: -2.3,
  })
  currentDrawdown: number;

  @ApiProperty({
    description: 'Date when maximum drawdown occurred',
    example: '2024-04-15T14:30:00.000Z',
    nullable: true,
  })
  maxDrawdownDate: string | null;
}

export class AnalyticsResponse {
  @ApiProperty({
    description: 'Period information for the analytics',
    type: PeriodInfo,
  })
  period: PeriodInfo;

  @ApiProperty({
    description: 'Trade statistics for the period',
    type: TradeStatistics,
  })
  trades: TradeStatistics;

  @ApiProperty({
    description: 'Return metrics for the period',
    type: ReturnMetrics,
  })
  returns: ReturnMetrics;

  @ApiProperty({
    description: 'Drawdown metrics for the period',
    type: DrawdownMetrics,
  })
  drawdown: DrawdownMetrics;
}

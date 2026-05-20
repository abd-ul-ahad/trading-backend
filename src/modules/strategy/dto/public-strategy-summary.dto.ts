import { ApiProperty } from '@nestjs/swagger';

/**
 * Public-facing strategy summary
 * Excludes sensitive information like capital invested
 * Only shows performance metrics (returns, win rate, drawdown)
 */
export class PublicStrategySummaryDto {
  @ApiProperty({
    description: 'Strategy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  strategyId: string;

  @ApiProperty({
    description: 'Strategy name',
    example: 'EUR/USD Scalper',
  })
  name: string;

  @ApiProperty({
    description: 'Total return percentage (NOT capital)',
    example: 15.5,
  })
  totalReturn: number;

  @ApiProperty({
    description: 'Win rate as a decimal (0-1)',
    example: 0.65,
  })
  winRate: number;

  @ApiProperty({
    description: 'Total number of trades',
    example: 100,
  })
  totalTrades: number;

  @ApiProperty({
    description: 'Maximum drawdown percentage',
    example: -8.5,
  })
  maxDrawdown: number;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-05-19T10:30:00.000Z',
  })
  lastUpdated: Date;
}

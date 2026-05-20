import { ApiProperty } from '@nestjs/swagger';

export class StrategyPerformanceDto {
  @ApiProperty({
    description: 'Strategy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  strategyId: string;

  @ApiProperty({
    description: 'Total return percentage',
    example: 15.5,
  })
  totalReturn: number;

  @ApiProperty({
    description: 'Total profit and loss in currency',
    example: 1550.00,
  })
  totalPnL: number;

  @ApiProperty({
    description: 'Unrealized profit and loss from open positions',
    example: 250.00,
  })
  unrealizedPnL: number;

  @ApiProperty({
    description: 'Realized profit and loss from closed positions',
    example: 1300.00,
  })
  realizedPnL: number;

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
    description: 'Number of winning trades',
    example: 65,
  })
  winningTrades: number;

  @ApiProperty({
    description: 'Number of losing trades',
    example: 35,
  })
  losingTrades: number;

  @ApiProperty({
    description: 'Maximum drawdown percentage',
    example: -8.5,
  })
  maxDrawdown: number;

  @ApiProperty({
    description: 'Current drawdown percentage',
    example: -2.1,
  })
  currentDrawdown: number;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-05-19T10:30:00.000Z',
  })
  lastUpdated: Date;
}

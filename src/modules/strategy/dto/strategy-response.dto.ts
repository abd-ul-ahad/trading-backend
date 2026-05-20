import { ApiProperty } from '@nestjs/swagger';

export class StrategyResponseDto {
  @ApiProperty({
    description: 'Strategy ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Strategy name',
    example: 'EUR/USD Scalper',
  })
  name: string;

  @ApiProperty({
    description: 'Strategy description',
    example: 'A scalping strategy for EUR/USD pair',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Account ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  account_id: string;

  @ApiProperty({
    description: 'Strategy status',
    enum: ['active', 'inactive'],
    example: 'active',
  })
  status: 'active' | 'inactive';

  @ApiProperty({
    description: 'Initial capital',
    example: 10000,
  })
  initial_capital: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-05-19T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-05-19T10:30:00.000Z',
  })
  updatedAt: Date;
}

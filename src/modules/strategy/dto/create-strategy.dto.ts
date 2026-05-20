import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class CreateStrategyDto {
  @ApiProperty({
    description: 'Strategy name',
    example: 'EUR/USD Scalper',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Strategy description',
    example: 'A scalping strategy for EUR/USD pair',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Account ID where this strategy will operate',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  account_id: string;

  @ApiProperty({
    description: 'Initial capital for the strategy',
    example: 10000,
  })
  @IsNumber()
  @IsNotEmpty()
  initial_capital: number;
}

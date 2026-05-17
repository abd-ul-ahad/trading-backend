import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class SubscribeStrategyDto {
  @ApiProperty({
    description: 'Strategy ID to subscribe to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  strategyId: string;

  @ApiProperty({
    description: 'Broker account ID to link to this subscription',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsString()
  @IsNotEmpty()
  brokerAccountId: string;

  @ApiProperty({
    description: 'Initial investment amount',
    example: 5000,
  })
  @IsNumber()
  @Min(100)
  @IsNotEmpty()
  initialInvestment: number;
}

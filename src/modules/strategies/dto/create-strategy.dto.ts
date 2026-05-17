import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateStrategyDto {
  @ApiProperty({
    description: 'Strategy name',
    example: 'Scalping Strategy',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Strategy description',
    example: 'High-frequency scalping strategy for forex',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Minimum investment required',
    example: 1000,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  minimumInvestment: number;

  @ApiProperty({
    description: 'Management fee percentage',
    example: 2.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  managementFeePercent: number;

  @ApiProperty({
    description: 'Performance fee percentage',
    example: 20,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  performanceFeePercent: number;
}

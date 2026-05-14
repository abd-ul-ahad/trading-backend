import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class AnalyticsQueryDto {
  @ApiProperty({
    description: 'Start date in ISO 8601 format',
    example: '2024-04-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'End date in ISO 8601 format',
    example: '2024-05-06T23:59:59.999Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    description: 'Optional strategy ID to filter analytics by specific strategy',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  strategyId?: string;
}

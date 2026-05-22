import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class AnalyticsQueryDto {
  @IsDateString()
  @IsNotEmpty()
  startDate: string;
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
  @IsOptional()
  @IsUUID()
  strategyId?: string;
}

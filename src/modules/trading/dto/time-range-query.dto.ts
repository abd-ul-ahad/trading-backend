import { IsDateString, IsNotEmpty } from 'class-validator';

export class TimeRangeQueryDto {
  @IsDateString()
  @IsNotEmpty()
  startTime: string;
  @IsDateString()
  @IsNotEmpty()
  endTime: string;
}

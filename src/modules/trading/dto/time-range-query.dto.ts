import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class TimeRangeQueryDto {
  @ApiProperty({
    description: 'Start time in ISO 8601 format',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'End time in ISO 8601 format',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;
}

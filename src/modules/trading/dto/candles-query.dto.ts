import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CandlesQueryDto {
  @ApiProperty({
    description: 'Candle timeframe',
    example: '1h',
    enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'],
  })
  @IsString()
  @IsNotEmpty()
  timeframe: string;
}

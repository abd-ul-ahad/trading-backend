import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class MarginQueryDto {
  @ApiProperty({ description: 'Trading symbol', example: 'EURUSD' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ description: 'Order type', example: 'ORDER_TYPE_BUY' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Trade volume in lots', example: 0.01 })
  @IsNumber()
  volume: number;
}

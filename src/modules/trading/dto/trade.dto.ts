import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import type { TradeActionType } from '../../../integrations/metaapi/interfaces';

export class TradeDto {
  @ApiProperty({
    description: 'Trade action type',
    enum: [
      'ORDER_TYPE_BUY',
      'ORDER_TYPE_SELL',
      'ORDER_TYPE_BUY_LIMIT',
      'ORDER_TYPE_SELL_LIMIT',
      'ORDER_TYPE_BUY_STOP',
      'ORDER_TYPE_SELL_STOP',
      'POSITION_MODIFY',
      'POSITION_CLOSE_ID',
      'POSITION_CLOSE_SYMBOL',
      'ORDER_MODIFY',
      'ORDER_CANCEL',
    ],
    example: 'ORDER_TYPE_BUY',
  })
  @IsString()
  @IsNotEmpty()
  actionType: TradeActionType;

  @ApiProperty({
    description: 'Trading symbol',
    example: 'EURUSD',
    required: false,
  })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiProperty({
    description: 'Trade volume in lots',
    example: 0.01,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  volume?: number;

  @ApiProperty({
    description: 'Open price for pending orders',
    example: 1.1234,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  openPrice?: number;

  @ApiProperty({
    description: 'Stop loss price',
    example: 1.12,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  stopLoss?: number;

  @ApiProperty({
    description: 'Take profit price',
    example: 1.13,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  takeProfit?: number;

  @ApiProperty({
    description: 'Position ID for position operations',
    example: 'pos123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  positionId?: string;

  @ApiProperty({
    description: 'Order ID for order operations',
    example: 'ord123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({
    description: 'Trade comment',
    example: 'Opening long position on EURUSD',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;
}

import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import type { TradeActionType } from '../../../integrations/metaapi/interfaces';

export class TradeDto {
  @IsString()
  @IsNotEmpty()
  actionType: TradeActionType;
  @IsOptional()
  @IsString()
  symbol?: string;
  @IsOptional()
  @IsNumber()
  volume?: number;
  @IsOptional()
  @IsNumber()
  openPrice?: number;
  @IsOptional()
  @IsNumber()
  stopLoss?: number;
  @IsOptional()
  @IsNumber()
  takeProfit?: number;
  @IsOptional()
  @IsString()
  positionId?: string;
  @IsOptional()
  @IsString()
  orderId?: string;
  @IsOptional()
  @IsString()
  comment?: string;
}

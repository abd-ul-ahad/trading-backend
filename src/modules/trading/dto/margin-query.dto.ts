import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class MarginQueryDto {
  @IsString()
  @IsNotEmpty()
  symbol: string;
  @IsString()
  @IsNotEmpty()
  type: string;
  @IsNumber()
  volume: number;
}

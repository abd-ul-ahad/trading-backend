import { IsString, IsNotEmpty } from 'class-validator';

export class CandlesQueryDto {
  @IsString()
  @IsNotEmpty()
  timeframe: string;
}

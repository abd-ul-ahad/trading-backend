import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class CreateStrategyDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsUUID()
  @IsNotEmpty()
  account_id: string;
  @IsNumber()
  @IsNotEmpty()
  initial_capital: number;
}

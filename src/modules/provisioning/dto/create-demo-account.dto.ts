import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateDemoAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsNumber()
  balance: number;
  @IsNumber()
  leverage: number;
  @IsString()
  @IsNotEmpty()
  serverName: string;
}

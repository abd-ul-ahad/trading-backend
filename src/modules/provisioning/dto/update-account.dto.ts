import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  name?: string;
  @IsOptional()
  @IsString()
  password?: string;
  @IsOptional()
  @IsString()
  server?: string;
  @IsOptional()
  @IsNumber()
  magic?: number;
}

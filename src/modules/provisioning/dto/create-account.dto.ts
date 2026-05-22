import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  type: string;
  @IsString()
  @IsNotEmpty()
  login: string;
  @IsString()
  @IsNotEmpty()
  password: string;
  @IsString()
  @IsNotEmpty()
  server: string;
  @IsString()
  @IsNotEmpty()
  provisioningProfileId: string;
  @IsOptional()
  @IsNumber()
  magic?: number;
  @IsOptional()
  @IsString()
  platform?: string;
}

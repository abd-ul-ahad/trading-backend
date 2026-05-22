import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLiveAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;
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
  @IsString()
  platform?: string;
}

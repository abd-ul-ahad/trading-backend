import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLiveAccountDto {
  @ApiProperty({
    description: 'Account name',
    example: 'My Live Account',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Trading account login',
    example: '12345678',
  })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({
    description: 'Trading account password',
    example: 'SecurePassword123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Broker server name',
    example: 'ICMarketsSC-Live',
  })
  @IsString()
  @IsNotEmpty()
  server: string;

  @ApiProperty({
    description: 'Provisioning profile ID',
    example: 'abc123def456',
  })
  @IsString()
  @IsNotEmpty()
  provisioningProfileId: string;

  @ApiProperty({
    description: 'Trading platform',
    example: 'mt4',
    required: false,
  })
  @IsOptional()
  @IsString()
  platform?: string;
}

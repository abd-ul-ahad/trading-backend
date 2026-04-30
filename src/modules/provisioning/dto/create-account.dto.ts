import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({
    description: 'Account name',
    example: 'My Trading Account',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Account type',
    example: 'cloud',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

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
    example: 'ICMarketsSC-Demo',
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
    description: 'Magic number for EA identification',
    example: 123456,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  magic?: number;

  @ApiProperty({
    description: 'Trading platform',
    example: 'mt4',
    required: false,
  })
  @IsOptional()
  @IsString()
  platform?: string;
}

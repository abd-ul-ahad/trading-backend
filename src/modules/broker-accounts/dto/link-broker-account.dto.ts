import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class LinkBrokerAccountDto {
  @ApiProperty({
    description: 'Broker name',
    example: 'MetaAPI',
  })
  @IsString()
  @IsNotEmpty()
  brokerName: string;

  @ApiProperty({
    description: 'Broker account number/login',
    example: '12345678',
  })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({
    description: 'Broker server name',
    example: 'ICMarketsSC-Demo',
  })
  @IsString()
  @IsNotEmpty()
  serverName: string;

  @ApiProperty({
    description: 'Read-only login credential',
    example: 'readonly_user',
  })
  @IsString()
  @IsNotEmpty()
  readOnlyLogin: string;

  @ApiProperty({
    description: 'Read-only password credential',
    example: 'readonly_password',
  })
  @IsString()
  @IsNotEmpty()
  readOnlyPassword: string;

  @ApiProperty({
    description: 'Account type',
    enum: ['demo', 'live'],
    example: 'demo',
  })
  @IsEnum(['demo', 'live'])
  @IsNotEmpty()
  accountType: 'demo' | 'live';
}

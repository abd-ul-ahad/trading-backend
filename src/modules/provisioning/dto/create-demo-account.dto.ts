import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateDemoAccountDto {
  @ApiProperty({
    description: 'Demo account name',
    example: 'My Demo Account',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Initial balance',
    example: 10000,
  })
  @IsNumber()
  balance: number;

  @ApiProperty({
    description: 'Account leverage',
    example: 100,
  })
  @IsNumber()
  leverage: number;

  @ApiProperty({
    description: 'Broker server name',
    example: 'ICMarketsSC-Demo',
  })
  @IsString()
  @IsNotEmpty()
  serverName: string;
}

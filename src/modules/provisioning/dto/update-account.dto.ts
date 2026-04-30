import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateAccountDto {
  @ApiProperty({
    description: 'Account name',
    example: 'My Updated Trading Account',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Trading account password',
    example: 'NewSecurePassword123',
    required: false,
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    description: 'Broker server name',
    example: 'ICMarketsSC-Demo',
    required: false,
  })
  @IsOptional()
  @IsString()
  server?: string;

  @ApiProperty({
    description: 'Magic number for EA identification',
    example: 123456,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  magic?: number;
}

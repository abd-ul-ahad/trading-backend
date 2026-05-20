import { ApiProperty } from '@nestjs/swagger';

export class EquityCurvePointDto {
  @ApiProperty({
    description: 'Timestamp of the data point',
    example: '2024-05-19T10:30:00.000Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Equity value at this timestamp',
    example: 10500,
  })
  equity: number;

  @ApiProperty({
    description: 'Total PnL at this timestamp',
    example: 500,
  })
  totalPnL: number;

  @ApiProperty({
    description: 'Drawdown percentage at this timestamp',
    example: -2.5,
  })
  drawdown: number;
}

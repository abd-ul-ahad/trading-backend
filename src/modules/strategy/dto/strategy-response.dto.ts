export class StrategyResponseDto {
  id: string;
  name: string;
  description: string | null;
  account_id: string;
  status: 'active' | 'inactive';
  initial_capital: number;
  createdAt: Date;
  updatedAt: Date;
}

import { IsString, IsNotEmpty } from 'class-validator';

export class CreateStrategyDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

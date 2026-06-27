import { IsNumber, IsDateString, Min } from 'class-validator';

export class CreateLimitationAllDto {
  @IsNumber()
  bouleNumero: number;

  @IsNumber()
  @Min(1)
  montant: number;

  @IsDateString()
  date: string;
}

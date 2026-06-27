import { IsNumber, IsString, IsDateString, Min } from 'class-validator';

export class CreateLimitationDto {
  @IsNumber()
  bouleNumero: number;

  @IsString()
  borlette: string;

  @IsString()
  tirage: string;

  @IsNumber()
  @Min(1)
  montant: number;

  @IsDateString()
  date: string;
}

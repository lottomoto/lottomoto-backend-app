import { IsString, IsUUID, Length, IsDateString } from 'class-validator';

export class CreateResultatDto {
  @IsDateString()
  date: string;

  @IsString()
  tirage: string;

  @IsUUID()
  borletteId: string;

  @IsString()
  @Length(3, 3)
  lot1: string;

  @IsString()
  @Length(2, 2)
  lot2: string;

  @IsString()
  @Length(2, 2)
  lot3: string;
}

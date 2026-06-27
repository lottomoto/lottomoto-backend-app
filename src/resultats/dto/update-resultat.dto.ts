import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateResultatDto {
  @IsOptional()
  @IsString()
  @Length(3, 3)
  lot1?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  lot2?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  lot3?: string;
}

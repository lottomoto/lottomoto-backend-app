import { IsString, IsArray, ValidateNested, MinLength, MaxLength, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class TirageDto {
  @IsString()
  nom: string;

  @IsString()
  ouverture: string;

  @IsString()
  fermeture: string;

  @IsOptional()
  @IsString()
  id?: string;
}

export class CreateBorletteDto {
  @IsString()
  nom: string;

  @IsString()
  @MinLength(2)
  @MaxLength(3)
  code: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TirageDto)
  tirages: TirageDto[];
}

import { IsString, IsUUID, IsArray, ValidateNested, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LottoType } from '../entities/ticket-ligne.entity';

export class CreateTicketLigneDto {
  @IsString()
  numero: string;

  @IsEnum(LottoType)
  type: LottoType;

  @IsString()
  option: string;

  @IsNumber()
  @Min(1)
  prix: number;
}

export class CreateTicketDto {
  @IsUUID()
  borletteId: string;

  @IsString()
  tirage: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTicketLigneDto)
  lignes: CreateTicketLigneDto[];
}

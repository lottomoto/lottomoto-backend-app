import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateSuccursaleDto {
  @IsString()
  nom: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsString()
  materielId: string;

  @IsOptional()
  @IsUUID()
  superviseurId?: string;

  @IsOptional()
  @IsUUID()
  vendeurId?: string;
}

import { IsString, IsOptional, IsNumber, Min, Max, MinLength } from 'class-validator';

export class CreateVendeurDto {
  @IsString()
  firstname: string;

  @IsString()
  lastname: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(4)
  pin: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commission?: number;

  @IsOptional()
  @IsString()
  succursale?: string;
}

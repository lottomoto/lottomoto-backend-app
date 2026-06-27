import { Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { LimitationsService } from './limitations.service';
import { CreateLimitationDto } from './dto/create-limitation.dto';
import { CreateLimitationAllDto } from './dto/create-limitation-all.dto';
import { IsArray, IsString } from 'class-validator';

class CreateAllDto extends CreateLimitationAllDto {
  @IsArray()
  @IsString({ each: true })
  borlettes: string[];

  @IsArray()
  @IsString({ each: true })
  tirages: string[];
}

@Controller('limitations')
export class LimitationsController {
  constructor(private readonly limitationsService: LimitationsService) {}

  @Post()
  create(@Body() dto: CreateLimitationDto) {
    return this.limitationsService.create(dto);
  }

  @Post('all')
  createForAll(@Body() dto: CreateAllDto) {
    return this.limitationsService.createForAll(
      dto.bouleNumero,
      dto.montant,
      dto.date,
      dto.borlettes,
      dto.tirages,
    );
  }

  @Get()
  findAll() {
    return this.limitationsService.findAll();
  }

  @Get('boule/:numero')
  findByBoule(@Param('numero', ParseIntPipe) numero: number) {
    return this.limitationsService.findByBoule(numero);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.limitationsService.remove(id);
  }
}

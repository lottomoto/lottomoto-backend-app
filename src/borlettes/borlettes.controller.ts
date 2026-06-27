import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BorlettesService } from './borlettes.service';
import { CreateBorletteDto } from './dto/create-borlette.dto';
import { UpdateBorletteDto } from './dto/update-borlette.dto';

@Controller('borlettes')
export class BorlettesController {
  constructor(private readonly borlettesService: BorlettesService) {}

  @Post()
  create(@Body() dto: CreateBorletteDto) {
    return this.borlettesService.create(dto);
  }

  @Get()
  findAll() {
    return this.borlettesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.borlettesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBorletteDto) {
    return this.borlettesService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.borlettesService.toggleActive(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.borlettesService.remove(id);
  }
}

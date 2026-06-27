import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ResultatsService } from './resultats.service';
import { CreateResultatDto } from './dto/create-resultat.dto';
import { UpdateResultatDto } from './dto/update-resultat.dto';

@Controller('resultats')
export class ResultatsController {
  constructor(private readonly resultatsService: ResultatsService) {}

  @Post()
  create(@Body() dto: CreateResultatDto) {
    return this.resultatsService.create(dto);
  }

  @Get()
  findAll() {
    return this.resultatsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resultatsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateResultatDto) {
    return this.resultatsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resultatsService.remove(id);
  }
}

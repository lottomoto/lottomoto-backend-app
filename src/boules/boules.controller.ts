import { Controller, Get, Param, Patch, ParseIntPipe, Body, Post } from '@nestjs/common';
import { BoulesService } from './boules.service';
import { UpdateBouleDto } from './dto/update-boule.dto';
import { IsArray, IsNumber } from 'class-validator';

class BlockMultipleDto {
  @IsArray()
  @IsNumber({}, { each: true })
  numeros: number[];
}

@Controller('boules')
export class BoulesController {
  constructor(private readonly boulesService: BoulesService) {}

  @Get()
  findAll() {
    return this.boulesService.findAll();
  }

  @Get(':numero')
  findOne(@Param('numero', ParseIntPipe) numero: number) {
    return this.boulesService.findOne(numero);
  }

  @Patch(':numero/toggle')
  toggle(@Param('numero', ParseIntPipe) numero: number) {
    return this.boulesService.toggleBlock(numero);
  }

  @Patch(':numero/status')
  setStatus(
    @Param('numero', ParseIntPipe) numero: number,
    @Body() dto: UpdateBouleDto,
  ) {
    return this.boulesService.setStatus(numero, dto.status);
  }

  @Post('block-multiple')
  blockMultiple(@Body() dto: BlockMultipleDto) {
    return this.boulesService.blockMultiple(dto.numeros);
  }

  @Post('unblock-all')
  unblockAll() {
    return this.boulesService.unblockAll();
  }
}

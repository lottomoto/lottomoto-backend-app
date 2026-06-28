import { Controller, Get, Param, Patch, ParseIntPipe, Body, Post, UseGuards } from '@nestjs/common';
import { BoulesService } from './boules.service';
import { UpdateBouleDto } from './dto/update-boule.dto';
import { IsArray, IsNumber } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR)
  toggle(@Param('numero', ParseIntPipe) numero: number) {
    return this.boulesService.toggleBlock(numero);
  }

  @Patch(':numero/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR)
  setStatus(
    @Param('numero', ParseIntPipe) numero: number,
    @Body() dto: UpdateBouleDto,
  ) {
    return this.boulesService.setStatus(numero, dto.status);
  }

  @Post('block-multiple')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR)
  blockMultiple(@Body() dto: BlockMultipleDto) {
    return this.boulesService.blockMultiple(dto.numeros);
  }

  @Post('unblock-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR)
  unblockAll() {
    return this.boulesService.unblockAll();
  }
}

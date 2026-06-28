import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BorlettesService } from './borlettes.service';
import { CreateBorletteDto } from './dto/create-borlette.dto';
import { UpdateBorletteDto } from './dto/update-borlette.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('borlettes')
export class BorlettesController {
  constructor(private readonly borlettesService: BorlettesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateBorletteDto) {
    return this.borlettesService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  toggleActive(@Param('id') id: string) {
    return this.borlettesService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.borlettesService.remove(id);
  }
}

import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ResultatsService } from './resultats.service';
import { CreateResultatDto } from './dto/create-resultat.dto';
import { UpdateResultatDto } from './dto/update-resultat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('resultats')
export class ResultatsController {
  constructor(private readonly resultatsService: ResultatsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateResultatDto) {
    return this.resultatsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.resultatsService.remove(id);
  }
}

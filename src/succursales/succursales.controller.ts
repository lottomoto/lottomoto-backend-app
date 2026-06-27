import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SuccursalesService } from './succursales.service';
import { CreateSuccursaleDto } from './dto/create-succursale.dto';
import { UpdateSuccursaleDto } from './dto/update-succursale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('succursales')
export class SuccursalesController {
  constructor(private readonly succursalesService: SuccursalesService) {}

  @Post()
  create(@Body() dto: CreateSuccursaleDto) {
    return this.succursalesService.create(dto);
  }

  @Get()
  findAll() {
    return this.succursalesService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMine(@Request() req: any) {
    const userId = req.user.uuid || req.user.id;
    return this.succursalesService.findBySuperviseur(userId);
  }

  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard)
  getMyDashboard(@Request() req: any) {
    const userId = req.user.uuid || req.user.id;
    return this.succursalesService.getSuperviseurDashboard(userId);
  }

  @Get('vendeur/me')
  @UseGuards(JwtAuthGuard)
  findMySuccursale(@Request() req: any) {
    const userId = req.user.uuid || req.user.id;
    return this.succursalesService.findByVendeurUserId(userId);
  }

  @Post('vendeur/me/rapport')
  @UseGuards(JwtAuthGuard)
  saveMyRapport(@Request() req: any, @Body() dto: { cashCollecte: number; dette: number; notes?: string }) {
    const userId = req.user.uuid || req.user.id;
    return this.succursalesService.saveVendeurRapport(userId, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.succursalesService.findOne(id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.succursalesService.getSuccursaleStats(id);
  }

  @Get(':id/rapports')
  getRapports(@Param('id') id: string) {
    return this.succursalesService.getRapports(id);
  }

  @Post(':id/collecter')
  collecterCash(@Param('id') id: string, @Body() dto: { cashRecu: number; dette?: number; notes?: string }) {
    return this.succursalesService.collecterCash(id, dto);
  }


  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSuccursaleDto) {
    return this.succursalesService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.succursalesService.toggleActive(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.succursalesService.remove(id);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SuccursalesService } from './succursales.service';
import { CreateSuccursaleDto } from './dto/create-succursale.dto';
import { UpdateSuccursaleDto } from './dto/update-succursale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('succursales')
export class SuccursalesController {
  constructor(private readonly succursalesService: SuccursalesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateSuccursaleDto) {
    return this.succursalesService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SUPPORT)
  findAll() {
    return this.succursalesService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERVISEUR)
  findMine(@Request() req: any) {
    const userId = req.user.uuid || req.user.id;
    return this.succursalesService.findBySuperviseur(userId);
  }

  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERVISEUR)
  getMyDashboard(@Request() req: any) {
    const userId = req.user.uuid || req.user.id;
    return this.succursalesService.getSuperviseurDashboard(userId);
  }

  @Get('vendeur/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDEUR)
  findMySuccursale(@Request() req: any) {
    const userId = req.user.uuid || req.user.id;
    return this.succursalesService.findByVendeurUserId(userId);
  }

  @Post('vendeur/me/rapport')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDEUR)
  saveMyRapport(@Request() req: any, @Body() dto: { cashCollecte: number; dette: number; notes?: string }) {
    const userId = req.user.uuid || req.user.id;
    return this.succursalesService.saveVendeurRapport(userId, dto);
  }

  @Get('comptable/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPTABLE)
  getComptableDashboard(@Request() req: any) {
    const userId = req.user.uuid || req.user.id;
    return this.succursalesService.getComptableDashboard(userId);
  }

  @Post('comptable/collecter/:superviseurId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPTABLE)
  comptableCollecter(
    @Param('superviseurId') superviseurId: string,
    @Body() dto: { cashRecu: number; notes?: string },
    @Request() req: any,
  ) {
    const comptableId = req.user.uuid || req.user.id;
    return this.succursalesService.comptableCollecter(comptableId, superviseurId, dto);
  }

  @Get('comptable/collections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPTABLE)
  getComptableCollections(@Request() req: any) {
    const comptableId = req.user.uuid || req.user.id;
    return this.succursalesService.getComptableCollections(comptableId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SUPPORT)
  findOne(@Param('id') id: string) {
    return this.succursalesService.findOne(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR, UserRole.COMPTABLE)
  getStats(@Param('id') id: string) {
    return this.succursalesService.getSuccursaleStats(id);
  }

  @Get(':id/rapports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR, UserRole.COMPTABLE)
  getRapports(@Param('id') id: string) {
    return this.succursalesService.getRapports(id);
  }

  @Post(':id/collecter')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR)
  collecterCash(@Param('id') id: string, @Body() dto: { cashRecu: number; dette?: number; notes?: string }) {
    return this.succursalesService.collecterCash(id, dto);
  }


  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateSuccursaleDto) {
    return this.succursalesService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  toggleActive(@Param('id') id: string) {
    return this.succursalesService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.succursalesService.remove(id);
  }
}

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Succursale } from '../succursales/entities/succursale.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { LogsService } from '../logs/logs.service';
import { ActionType } from '../logs/entities/log.entity';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    @InjectRepository(Succursale)
    private readonly succursaleRepository: Repository<Succursale>,
    private readonly logsService: LogsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTicketDto, @Request() req: any) {
    const userId = req.user.uuid || req.user.id;
    return this.ticketsService.create(dto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.SUPPORT)
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMyTickets(@Request() req: any) {
    const userId = req.user.uuid || req.user.id;
    return this.ticketsService.findByVendeur(userId);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  getMyStats(@Request() req: any) {
    const userId = req.user.uuid || req.user.id;
    return this.ticketsService.getVendeurStats(userId);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR, UserRole.COMPTABLE)
  async getAdminStats(
    @Query('periode') periode: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('vendeurId') vendeurId: string,
    @Request() req: any,
  ) {
    const role = req.user.role;
    if (role === 'superviseur') {
      const userId = req.user.uuid || req.user.id;
      const succursales = await this.succursaleRepository.find({
        where: { superviseurId: userId },
        relations: { vendeur: true },
      });
      const vendeurUserIds = succursales
        .filter(s => s.vendeur?.userId)
        .map(s => s.vendeur!.userId);
      if (vendeurUserIds.length === 0) {
        return {
          recettes: 0, paiements: 0, benefice: 0, ticketCount: 0,
          vendeursActifs: 0, topVendeurs: [], tiragesJour: [],
          parBorlette: [], chartData: [], revenueByTirage: [],
          tirageNames: [], lotto4: 0, lotto5: 0, topBoules: [],
          boulesBloquees: 0, recentTickets: [], tirageActif: null,
        };
      }
      return this.ticketsService.getAdminStats(periode || 'auj', vendeurUserIds, dateFrom, dateTo);
    }
    const filterVendeurIds = vendeurId ? [vendeurId] : undefined;
    return this.ticketsService.getAdminStats(periode || 'auj', filterVendeurIds, dateFrom, dateTo);
  }

  @Get('boules/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR)
  getBoulePlayCounts() {
    return this.ticketsService.getBoulePlayCounts();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR, UserRole.COMPTABLE, UserRole.SUPPORT)
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id/pay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE)
  async payTicket(@Request() req: any, @Param('id') id: string) {
    const result = await this.ticketsService.payTicket(id);
    this.logsService.create({
      action: ActionType.PAY,
      entityType: 'Ticket',
      entityId: id,
      userId: req.user.uuid || req.user.id,
    });
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISEUR)
  async remove(@Request() req: any, @Param('id') id: string) {
    await this.ticketsService.remove(id);
    this.logsService.create({
      action: ActionType.DELETE,
      entityType: 'Ticket',
      entityId: id,
      userId: req.user.uuid || req.user.id,
    });
  }
}

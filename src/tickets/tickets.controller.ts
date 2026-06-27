import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Succursale } from '../succursales/entities/succursale.entity';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    @InjectRepository(Succursale)
    private readonly succursaleRepository: Repository<Succursale>,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTicketDto, @Request() req: any) {
    const userId = req.user.uuid || req.user.id;
    return this.ticketsService.create(dto, userId);
  }

  @Get()
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
  @UseGuards(JwtAuthGuard)
  async getAdminStats(@Query('periode') periode: string, @Request() req: any) {
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
      return this.ticketsService.getAdminStats(periode || 'auj', vendeurUserIds);
    }
    return this.ticketsService.getAdminStats(periode || 'auj');
  }

  @Get('boules/stats')
  getBoulePlayCounts() {
    return this.ticketsService.getBoulePlayCounts();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id/pay')
  payTicket(@Param('id') id: string) {
    return this.ticketsService.payTicket(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}

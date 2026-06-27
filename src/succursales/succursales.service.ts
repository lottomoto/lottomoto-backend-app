import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Succursale } from './entities/succursale.entity';
import { SuccursaleRapport } from './entities/succursale-rapport.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Vendeur } from '../vendeurs/entities/vendeur.entity';
import { CreateSuccursaleDto } from './dto/create-succursale.dto';
import { UpdateSuccursaleDto } from './dto/update-succursale.dto';

@Injectable()
export class SuccursalesService {
  constructor(
    @InjectRepository(Succursale)
    private readonly succursaleRepository: Repository<Succursale>,
    @InjectRepository(SuccursaleRapport)
    private readonly rapportRepository: Repository<SuccursaleRapport>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Vendeur)
    private readonly vendeurRepository: Repository<Vendeur>,
  ) {}

  async create(dto: CreateSuccursaleDto): Promise<any> {
    const existingMateriel = await this.succursaleRepository.findOne({
      where: { materielId: dto.materielId },
    });
    if (existingMateriel) {
      throw new ConflictException('Cet ID matériel existe déjà');
    }

    if (dto.vendeurId) {
      const vendeurPris = await this.succursaleRepository.findOne({
        where: { vendeurId: dto.vendeurId },
      });
      if (vendeurPris) {
        throw new ConflictException('Ce vendeur est déjà affecté à une autre succursale');
      }
    }

    const succursale = this.succursaleRepository.create(dto);
    const saved = await this.succursaleRepository.save(succursale);
    return this.findOne(saved.id);
  }

  async findAll(): Promise<any[]> {
    const succursales = await this.succursaleRepository.find({
      relations: { superviseur: true, vendeur: true },
      order: { createdAt: 'DESC' },
    });
    return succursales.map((s) => this.format(s));
  }

  async findOne(id: string): Promise<any> {
    const succursale = await this.succursaleRepository.findOne({
      where: { id },
      relations: { superviseur: true, vendeur: true },
    });
    if (!succursale) throw new NotFoundException('Succursale non trouvée');
    return this.format(succursale);
  }

  async update(id: string, dto: UpdateSuccursaleDto): Promise<any> {
    const succursale = await this.succursaleRepository.findOne({ where: { id } });
    if (!succursale) throw new NotFoundException('Succursale non trouvée');

    if (dto.materielId && dto.materielId !== succursale.materielId) {
      const existing = await this.succursaleRepository.findOne({
        where: { materielId: dto.materielId },
      });
      if (existing) throw new ConflictException('Cet ID matériel existe déjà');
    }

    if (dto.vendeurId && dto.vendeurId !== succursale.vendeurId) {
      const vendeurPris = await this.succursaleRepository.findOne({
        where: { vendeurId: dto.vendeurId },
      });
      if (vendeurPris) {
        throw new ConflictException('Ce vendeur est déjà affecté à une autre succursale');
      }
    }

    await this.succursaleRepository.update(id, dto);
    return this.findOne(id);
  }

  async toggleActive(id: string): Promise<any> {
    const succursale = await this.succursaleRepository.findOne({ where: { id } });
    if (!succursale) throw new NotFoundException('Succursale non trouvée');
    await this.succursaleRepository.update(id, { isActive: !succursale.isActive });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.succursaleRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Succursale non trouvée');
  }

  async findBySuperviseur(superviseurId: string): Promise<any[]> {
    const succursales = await this.succursaleRepository.find({
      where: { superviseurId },
      relations: { superviseur: true, vendeur: true },
      order: { createdAt: 'DESC' },
    });
    return succursales.map((s) => this.format(s));
  }

  async getSuccursaleStats(succursaleId: string): Promise<any> {
    const succursale = await this.succursaleRepository.findOne({
      where: { id: succursaleId },
      relations: { vendeur: true },
    });
    if (!succursale) throw new NotFoundException('Succursale non trouvée');

    const today = new Date().toISOString().split('T')[0];

    const vendeurUserId = succursale.vendeur?.userId;
    let totalVentes = 0;
    let ticketCount = 0;
    if (vendeurUserId) {
      const tickets = await this.ticketRepository.find({
        where: { vendeurUserId, date: today },
      });
      totalVentes = tickets.reduce((s, t) => s + Number(t.total), 0);
      ticketCount = tickets.length;
    }

    const rapport = await this.rapportRepository.findOne({
      where: { succursaleId, date: today },
    });

    return {
      succursale: this.format(succursale),
      today: {
        ventes: totalVentes,
        tickets: ticketCount,
        cashCollecte: rapport ? Number(rapport.cashCollecte) : 0,
        dette: rapport ? Number(rapport.dette) : 0,
        notes: rapport?.notes || '',
      },
    };
  }

  async getSuperviseurDashboard(superviseurId: string): Promise<any> {
    const succursales = await this.succursaleRepository.find({
      where: { superviseurId },
      relations: { vendeur: true },
    });

    const today = new Date().toISOString().split('T')[0];
    const results: { id: string; nom: string; isActive: boolean; vendeur: string | null; ventes: number; tickets: number; cashACollecter: number; totalCollecte: number; dette: number }[] = [];

    let cashEnMain = 0;

    for (const s of succursales) {
      let ventes = 0;
      let tickets = 0;
      if (s.vendeur?.userId) {
        const tix = await this.ticketRepository.find({
          where: { vendeurUserId: s.vendeur.userId, date: today },
        });
        ventes = tix.reduce((sum, t) => sum + Number(t.total), 0);
        tickets = tix.length;
      }

      const rapports = await this.rapportRepository.find({
        where: { succursaleId: s.id, date: today },
      });
      const totalCollecte = rapports.reduce((sum, r) => sum + Number(r.cashCollecte), 0);
      const cashACollecter = Math.max(ventes - totalCollecte, 0);
      cashEnMain += totalCollecte;

      results.push({
        id: s.id,
        nom: s.nom,
        isActive: s.isActive,
        vendeur: s.vendeur
          ? `${s.vendeur.user?.firstname || ''} ${s.vendeur.user?.lastname || ''}`.trim()
          : null,
        ventes,
        tickets,
        cashACollecter,
        totalCollecte,
        dette: cashACollecter,
      });
    }

    const totalVentes = results.reduce((s, r) => s + r.ventes, 0);
    const totalDette = results.reduce((s, r) => s + r.cashACollecter, 0);

    return {
      succursales: results,
      totaux: { ventes: totalVentes, cashEnMain, dette: totalDette },
    };
  }

  async collecterCash(succursaleId: string, dto: { cashRecu: number; dette?: number; notes?: string }): Promise<any> {
    const succursale = await this.succursaleRepository.findOne({
      where: { id: succursaleId },
      relations: { vendeur: true },
    });
    if (!succursale) throw new NotFoundException('Succursale non trouvée');

    const today = new Date().toISOString().split('T')[0];

    let ventes = 0;
    if (succursale.vendeur?.userId) {
      const tix = await this.ticketRepository.find({
        where: { vendeurUserId: succursale.vendeur.userId, date: today },
      });
      ventes = tix.reduce((sum, t) => sum + Number(t.total), 0);
    }
    const existing = await this.rapportRepository.find({ where: { succursaleId, date: today } });
    const dejaCollecte = existing.reduce((sum, r) => sum + Number(r.cashCollecte), 0);
    const cashACollecter = Math.max(ventes - dejaCollecte, 0);

    const cashRecu = Math.min(dto.cashRecu, cashACollecter);

    const rapport = this.rapportRepository.create({
      succursaleId,
      date: today,
      cashCollecte: cashRecu,
      dette: Math.max(cashACollecter - cashRecu, 0),
      notes: dto.notes || undefined,
    });
    return this.rapportRepository.save(rapport);
  }

  async getRapports(succursaleId: string): Promise<any[]> {
    return this.rapportRepository.find({
      where: { succursaleId },
      order: { date: 'DESC' },
      take: 30,
    });
  }

  async findByVendeurUserId(userId: string): Promise<any> {
    const vendeur = await this.vendeurRepository.findOne({ where: { userId } });
    if (!vendeur) return null;
    const succursale = await this.succursaleRepository.findOne({
      where: { vendeurId: vendeur.id },
      relations: { superviseur: true, vendeur: true },
    });
    if (!succursale) return null;

    const today = new Date().toISOString().split('T')[0];
    const rapport = await this.rapportRepository.findOne({
      where: { succursaleId: succursale.id, date: today },
    });

    return {
      succursale: this.format(succursale),
      rapport: rapport ? {
        cashCollecte: Number(rapport.cashCollecte),
        dette: Number(rapport.dette),
        notes: rapport.notes || '',
      } : { cashCollecte: 0, dette: 0, notes: '' },
    };
  }

  async saveVendeurRapport(userId: string, dto: { cashCollecte: number; dette: number; notes?: string }): Promise<any> {
    const vendeur = await this.vendeurRepository.findOne({ where: { userId } });
    if (!vendeur) throw new NotFoundException('Vendeur non trouvé');
    const succursale = await this.succursaleRepository.findOne({
      where: { vendeurId: vendeur.id },
    });
    if (!succursale) throw new NotFoundException('Aucune succursale liée');

    const today = new Date().toISOString().split('T')[0];
    const rapport = this.rapportRepository.create({
      succursaleId: succursale.id,
      date: today,
      cashCollecte: dto.cashCollecte,
      dette: dto.dette,
      notes: dto.notes,
    });
    return this.rapportRepository.save(rapport);
  }

  private format(s: Succursale): any {
    return {
      id: s.id,
      nom: s.nom,
      adresse: s.adresse,
      materielId: s.materielId,
      isActive: s.isActive,
      superviseur: s.superviseur
        ? { id: s.superviseur.id, nom: `${s.superviseur.firstname} ${s.superviseur.lastname}` }
        : null,
      vendeur: s.vendeur
        ? { id: s.vendeur.id, nom: `${s.vendeur.user?.firstname || ''} ${s.vendeur.user?.lastname || ''}`.trim(), username: s.vendeur.username }
        : null,
      createdAt: s.createdAt,
    };
  }
}

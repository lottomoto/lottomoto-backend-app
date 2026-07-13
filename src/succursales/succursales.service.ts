import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Succursale } from './entities/succursale.entity';
import { SuccursaleRapport } from './entities/succursale-rapport.entity';
import { ComptableCollection } from './entities/comptable-collection.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Vendeur } from '../vendeurs/entities/vendeur.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateSuccursaleDto } from './dto/create-succursale.dto';
import { UpdateSuccursaleDto } from './dto/update-succursale.dto';

@Injectable()
export class SuccursalesService {
  constructor(
    @InjectRepository(Succursale)
    private readonly succursaleRepository: Repository<Succursale>,
    @InjectRepository(SuccursaleRapport)
    private readonly rapportRepository: Repository<SuccursaleRapport>,
    @InjectRepository(ComptableCollection)
    private readonly collectionRepository: Repository<ComptableCollection>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Vendeur)
    private readonly vendeurRepository: Repository<Vendeur>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

    if (dto.vendeurId !== undefined && dto.vendeurId !== succursale.vendeurId) {
      // Clear deviceId of old vendor when unlinked from succursale
      if (succursale.vendeurId) {
        await this.vendeurRepository.update(succursale.vendeurId, { deviceId: null as any });
      }
      if (dto.vendeurId) {
        const vendeurPris = await this.succursaleRepository.findOne({
          where: { vendeurId: dto.vendeurId },
        });
        if (vendeurPris) {
          throw new ConflictException('Ce vendeur est déjà affecté à une autre succursale');
        }
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
    const succursale = await this.succursaleRepository.findOne({ where: { id } });
    if (!succursale) throw new NotFoundException('Succursale non trouvée');
    if (succursale.vendeurId) {
      await this.vendeurRepository.update(succursale.vendeurId, { deviceId: null as any });
    }
    await this.succursaleRepository.delete(id);
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
      let paiements = 0;
      let tickets = 0;
      if (s.vendeur?.userId) {
        const tix = await this.ticketRepository.find({
          where: { vendeurUserId: s.vendeur.userId, date: today },
        });
        ventes = tix.reduce((sum, t) => sum + Number(t.total), 0);
        paiements = tix.filter(t => t.status === 'paye').reduce((sum, t) => sum + Number(t.gainTotal || 0), 0);
        tickets = tix.length;
      }

      const rapports = await this.rapportRepository.find({
        where: { succursaleId: s.id, date: today },
      });
      const totalCollecte = rapports.reduce((sum, r) => sum + Number(r.cashCollecte), 0);
      const cashACollecter = Math.max(ventes - paiements - totalCollecte, 0);
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
    let paiements = 0;
    if (succursale.vendeur?.userId) {
      const tix = await this.ticketRepository.find({
        where: { vendeurUserId: succursale.vendeur.userId, date: today },
      });
      ventes = tix.reduce((sum, t) => sum + Number(t.total), 0);
      paiements = tix.filter(t => t.status === 'paye').reduce((sum, t) => sum + Number(t.gainTotal || 0), 0);
    }
    const existing = await this.rapportRepository.find({ where: { succursaleId, date: today } });
    const dejaCollecte = existing.reduce((sum, r) => sum + Number(r.cashCollecte), 0);
    const cashACollecter = Math.max(ventes - paiements - dejaCollecte, 0);

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

  async getComptableDashboard(comptableId: string): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const superviseurs = await this.userRepository.find({ where: { role: UserRole.SUPERVISEUR, isActive: true } });

    const results: { id: string; nom: string; cashEnMain: number; totalCollecte: number; cashACollecter: number }[] = [];
    let myCashEnMain = 0;

    for (const sup of superviseurs) {
      const succursales = await this.succursaleRepository.find({
        where: { superviseurId: sup.id },
        relations: { vendeur: true },
      });

      let supCashEnMain = 0;
      for (const s of succursales) {
        if (s.vendeur?.userId) {
          const tix = await this.ticketRepository.find({ where: { vendeurUserId: s.vendeur.userId, date: today } });
          const ventes = tix.reduce((sum, t) => sum + Number(t.total), 0);
          const rapports = await this.rapportRepository.find({ where: { succursaleId: s.id, date: today } });
          const collecte = rapports.reduce((sum, r) => sum + Number(r.cashCollecte), 0);
          supCashEnMain += collecte;
        }
      }

      const collections = await this.collectionRepository.find({ where: { superviseurId: sup.id, date: today } });
      const dejaCollecte = collections.reduce((sum, c) => sum + Number(c.cashRecu), 0);
      const cashACollecter = Math.max(supCashEnMain - dejaCollecte, 0);

      const myCollections = collections.filter(c => c.comptableId === comptableId);
      myCashEnMain += myCollections.reduce((sum, c) => sum + Number(c.cashRecu), 0);

      results.push({
        id: sup.id,
        nom: `${sup.firstname} ${sup.lastname}`,
        cashEnMain: supCashEnMain,
        totalCollecte: dejaCollecte,
        cashACollecter,
      });
    }

    const totalACollecter = results.reduce((s, r) => s + r.cashACollecter, 0);
    const totalDette = await this.collectionRepository
      .createQueryBuilder('c')
      .where('c.comptable_id = :comptableId', { comptableId })
      .andWhere('c.date = :today', { today })
      .select('COALESCE(SUM(c.dette), 0)', 'total')
      .getRawOne()
      .then(r => parseFloat(r?.total || '0'));

    return {
      superviseurs: results.filter(r => r.cashEnMain > 0 || r.cashACollecter > 0),
      totaux: { cashEnMain: myCashEnMain, aCollecter: totalACollecter, dette: totalDette },
    };
  }

  async comptableCollecter(comptableId: string, superviseurId: string, dto: { cashRecu: number; notes?: string }): Promise<any> {
    const today = new Date().toISOString().split('T')[0];

    const succursales = await this.succursaleRepository.find({
      where: { superviseurId },
      relations: { vendeur: true },
    });

    let supCashEnMain = 0;
    for (const s of succursales) {
      if (s.vendeur?.userId) {
        const tix = await this.ticketRepository.find({ where: { vendeurUserId: s.vendeur.userId, date: today } });
        const ventes = tix.reduce((sum, t) => sum + Number(t.total), 0);
        const rapports = await this.rapportRepository.find({ where: { succursaleId: s.id, date: today } });
        supCashEnMain += rapports.reduce((sum, r) => sum + Number(r.cashCollecte), 0);
      }
    }

    const existingCollections = await this.collectionRepository.find({ where: { superviseurId, date: today } });
    const dejaCollecte = existingCollections.reduce((sum, c) => sum + Number(c.cashRecu), 0);
    const cashACollecter = Math.max(supCashEnMain - dejaCollecte, 0);
    const cashRecu = Math.min(dto.cashRecu, cashACollecter);
    const dette = Math.max(cashACollecter - cashRecu, 0);

    const collection = this.collectionRepository.create({
      superviseurId,
      comptableId,
      date: today,
      cashRecu,
      dette,
      notes: dto.notes || undefined,
    });
    return this.collectionRepository.save(collection);
  }

  async getComptableCollections(comptableId: string): Promise<any[]> {
    return this.collectionRepository.find({
      where: { comptableId },
      relations: { superviseur: true },
      order: { createdAt: 'DESC' },
      take: 50,
    });
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
        ? { id: s.vendeur.id, userId: s.vendeur.userId, nom: `${s.vendeur.user?.firstname || ''} ${s.vendeur.user?.lastname || ''}`.trim(), username: s.vendeur.username }
        : null,
      createdAt: s.createdAt,
    };
  }
}

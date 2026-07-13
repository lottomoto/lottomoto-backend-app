import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { TicketLigne, LottoType } from './entities/ticket-ligne.entity';
import { Boule, BouleStatus } from '../boules/entities/boule.entity';
import { Limitation } from '../limitations/entities/limitation.entity';
import { Tirage } from '../borlettes/entities/tirage.entity';
import { Vendeur } from '../vendeurs/entities/vendeur.entity';
import { Succursale } from '../succursales/entities/succursale.entity';
import { SettingsService } from '../settings/settings.service';
import { CreateTicketDto, CreateTicketLigneDto } from './dto/create-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketLigne)
    private readonly ligneRepository: Repository<TicketLigne>,
    @InjectRepository(Boule)
    private readonly bouleRepository: Repository<Boule>,
    @InjectRepository(Limitation)
    private readonly limitationRepository: Repository<Limitation>,
    @InjectRepository(Tirage)
    private readonly tirageRepository: Repository<Tirage>,
    @InjectRepository(Vendeur)
    private readonly vendeurRepository: Repository<Vendeur>,
    @InjectRepository(Succursale)
    private readonly succursaleRepository: Repository<Succursale>,
    private readonly settingsService: SettingsService,
  ) {}

  private parseBoules(ligne: CreateTicketLigneDto): { boule1: number; boule2: number | null; boule3: number | null; prefix: number | null } {
    if (ligne.type === LottoType.BORLETTE) {
      if (ligne.numero.length !== 2) throw new BadRequestException(`Borlette doit avoir 2 chiffres: ${ligne.numero}`);
      return { boule1: parseInt(ligne.numero), boule2: null, boule3: null, prefix: null };
    }
    if (ligne.type === LottoType.MARIAGE) {
      const num = ligne.numero.replace('*', '');
      if (num.length !== 4) throw new BadRequestException(`Mariage doit avoir 4 chiffres: ${ligne.numero}`);
      return { boule1: parseInt(num.substring(0, 2)), boule2: parseInt(num.substring(2, 4)), boule3: null, prefix: null };
    }
    if (ligne.type === LottoType.BLOTTO3) {
      if (ligne.numero.length !== 3) throw new BadRequestException(`Lotto 3 doit avoir 3 chiffres: ${ligne.numero}`);
      return { prefix: parseInt(ligne.numero.substring(0, 1)), boule1: parseInt(ligne.numero.substring(1, 3)), boule2: null, boule3: null };
    }
    if (ligne.type === LottoType.LOTTO4 || ligne.type === LottoType.BLOTTO4) {
      if (ligne.numero.length !== 4) throw new BadRequestException(`Lotto 4 doit avoir 4 chiffres: ${ligne.numero}`);
      return { boule1: parseInt(ligne.numero.substring(0, 2)), boule2: parseInt(ligne.numero.substring(2, 4)), boule3: null, prefix: null };
    }
    if (ligne.type === LottoType.LOTTO5 || ligne.type === LottoType.BLOTTO5) {
      if (ligne.numero.length !== 5) throw new BadRequestException(`Lotto 5 doit avoir 5 chiffres: ${ligne.numero}`);
      return { prefix: parseInt(ligne.numero.substring(0, 1)), boule1: parseInt(ligne.numero.substring(1, 3)), boule2: parseInt(ligne.numero.substring(3, 5)), boule3: null };
    }
    if (ligne.type === LottoType.JACKPOT) {
      if (ligne.numero.length !== 6) throw new BadRequestException(`Jackpot doit avoir 6 chiffres: ${ligne.numero}`);
      return { boule1: parseInt(ligne.numero.substring(0, 2)), boule2: parseInt(ligne.numero.substring(2, 4)), boule3: parseInt(ligne.numero.substring(4, 6)), prefix: null };
    }
    throw new BadRequestException(`Type non reconnu: ${ligne.type}`);
  }

  private async checkBouleRestrictions(
    boule1: number,
    boule2: number | null,
    borletteId: string,
    tirage: string,
    date: string,
    prix: number,
    type: string,
  ): Promise<void> {
    const b1 = await this.bouleRepository.findOne({ where: { numero: boule1 } });
    const b2 = boule2 !== null ? await this.bouleRepository.findOne({ where: { numero: boule2 } }) : null;

    const b1Blocked = b1?.status === BouleStatus.BLOQUEE;
    const b2Blocked = b2?.status === BouleStatus.BLOQUEE;

    if (b1Blocked && b2Blocked) {
      throw new BadRequestException(`Les 2 boules ${String(boule1).padStart(2, '0')} et ${String(boule2).padStart(2, '0')} sont bloquées`);
    } else if (b1Blocked && boule2 === null) {
      throw new BadRequestException(`La boule ${String(boule1).padStart(2, '0')} est bloquée`);
    }

    const borletteEntity = await this.bouleRepository.manager
      .getRepository('borlettes')
      .findOne({ where: { id: borletteId } });
    const borletteName = borletteEntity?.nom || '';

    const lim1 = await this.limitationRepository.findOne({
      where: { bouleId: b1?.id, borlette: borletteName, tirage, date },
    });
    const lim2 = boule2 !== null ? await this.limitationRepository.findOne({
      where: { bouleId: b2?.id, borlette: borletteName, tirage, date },
    }) : null;

    const isSingleBoule = type === LottoType.BORLETTE || type === LottoType.BLOTTO3;
    const montantAajouter = isSingleBoule ? prix : prix / 2;

    if (lim1) {
      const totalVentes = await this.getTotalVentes(boule1, borletteId, tirage, date);
      if (totalVentes + montantAajouter > Number(lim1.montant)) {
        throw new BadRequestException(`Boule ${String(boule1).padStart(2, '0')} a atteint sa limite de ${lim1.montant} HTG (déjà ${totalVentes.toLocaleString()} HTG)`);
      }
    }

    if (lim2 && boule2 !== null) {
      const totalVentes = await this.getTotalVentes(boule2, borletteId, tirage, date);
      if (totalVentes + montantAajouter > Number(lim2.montant)) {
        throw new BadRequestException(`Boule ${String(boule2).padStart(2, '0')} a atteint sa limite de ${lim2.montant} HTG (déjà ${totalVentes.toLocaleString()} HTG)`);
      }
    }
  }

  private async getTotalVentes(bouleNum: number, borletteId: string, tirage: string, date: string): Promise<number> {
    const result = await this.ligneRepository
      .createQueryBuilder('l')
      .innerJoin('l.ticket', 't')
      .where('t.borletteId = :borletteId', { borletteId })
      .andWhere('t.tirage = :tirage', { tirage })
      .andWhere('t.date = :date', { date })
      .andWhere('(l.boule1 = :num OR l.boule2 = :num)', { num: bouleNum })
      .select("COALESCE(SUM(CASE WHEN l.type IN ('borlette', 'blotto3') THEN l.prix ELSE l.prix / 2 END), 0)", 'total')
      .getRawOne();
    return parseFloat(result?.total || '0');
  }

  private getTodayHaiti(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Port-au-Prince', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  }

  private getCurrentTimeHaiti(): string {
    return new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Port-au-Prince', hour: '2-digit', minute: '2-digit' }).format(new Date());
  }

  private generateRef(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let ref = 'T';
    for (let i = 0; i < 6; i++) {
      ref += chars[Math.floor(Math.random() * chars.length)];
    }
    return ref;
  }

  async create(dto: CreateTicketDto, vendeurUserId: string): Promise<any> {
    const vendeur = await this.vendeurRepository.findOne({ where: { userId: vendeurUserId } });
    if (vendeur) {
      const succursale = await this.succursaleRepository.findOne({ where: { vendeurId: vendeur.id } });
      if (!succursale) {
        throw new BadRequestException('Vous n\'êtes lié à aucune succursale');
      }
      if (!succursale.isActive) {
        throw new BadRequestException('Votre succursale est désactivée');
      }
    }

    const today = this.getTodayHaiti();
    const currentTime = this.getCurrentTimeHaiti();

    const tirage = await this.tirageRepository.findOne({
      where: { borletteId: dto.borletteId, nom: dto.tirage },
    });
    if (!tirage) {
      throw new BadRequestException('Tirage non trouvé');
    }
    if (currentTime >= tirage.fermeture) {
      throw new BadRequestException(`Le tirage ${tirage.nom} est fermé (fermeture à ${tirage.fermeture})`);
    }

    const parsedLignes = dto.lignes.map((l) => {
      const { boule1, boule2, boule3, prefix } = this.parseBoules(l);
      return { ...l, boule1, boule2, boule3, prefix };
    });

    for (const l of parsedLignes) {
      await this.checkBouleRestrictions(l.boule1, l.boule2, dto.borletteId, dto.tirage, today, l.prix, l.type);
    }

    const total = parsedLignes.reduce((s, l) => s + l.prix, 0);
    let ref = this.generateRef();
    while (await this.ticketRepository.findOne({ where: { ref } })) {
      ref = this.generateRef();
    }

    const ticket = this.ticketRepository.create({
      ref,
      vendeurUserId,
      borletteId: dto.borletteId,
      tirage: dto.tirage,
      date: today,
      total,
      status: TicketStatus.EN_ATTENTE,
      createdAt: new Date(),
      lignes: parsedLignes.map((l) => this.ligneRepository.create({
        numero: l.numero,
        type: l.type,
        boule1: l.boule1,
        boule2: l.boule2 ?? undefined,
        boule3: l.boule3 ?? undefined,
        prefix: l.prefix ?? undefined,
        option: l.option,
        prix: l.prix,
      })),
    });

    const saved = await this.ticketRepository.save(ticket);
    return this.findOne(saved.id);
  }

  async findAll(): Promise<any[]> {
    const tickets = await this.ticketRepository.find({
      relations: { borlette: true, lignes: true, vendeurUser: true },
      order: { createdAt: 'DESC' },
    });
    return tickets.map((t) => this.format(t));
  }

  async findByVendeur(vendeurUserId: string): Promise<any> {
    const tickets = await this.ticketRepository.find({
      where: { vendeurUserId },
      relations: { borlette: true, lignes: true, vendeurUser: true },
      order: { createdAt: 'DESC' },
    });
    return tickets.map((t) => this.format(t));
  }

  async findOne(idOrRef: string): Promise<any> {
    const ticket = await this.ticketRepository.findOne({
      where: [{ id: idOrRef }, { ref: idOrRef }],
      relations: { borlette: true, lignes: true, vendeurUser: true },
    });
    if (!ticket) throw new NotFoundException('Ticket non trouvé');
    return this.format(ticket);
  }

  async remove(id: string): Promise<void> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket non trouvé');
    if (ticket.status !== TicketStatus.EN_ATTENTE) {
      throw new BadRequestException('Seuls les tickets en attente peuvent être supprimés');
    }
    await this.ticketRepository.delete(id);
  }

  async payTicket(id: string): Promise<any> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket non trouvé');
    if (ticket.status !== TicketStatus.GAGNE) {
      throw new BadRequestException('Seuls les tickets gagnants peuvent être payés');
    }
    ticket.status = TicketStatus.PAYE;
    await this.ticketRepository.save(ticket);
    return this.findOne(id);
  }

  async getVendeurStats(vendeurUserId: string): Promise<any> {
    const today = this.getTodayHaiti();

    const todayTickets = await this.ticketRepository.find({
      where: { vendeurUserId, date: today },
      relations: { lignes: true },
    });

    const vendeur = await this.vendeurRepository.findOne({ where: { userId: vendeurUserId } });
    let commissionRate = vendeur?.commission ? Number(vendeur.commission) : null;
    if (commissionRate === null) {
      const systemRate = await this.settingsService.get('system.commission');
      commissionRate = systemRate ? Number(systemRate) : 15;
    }

    const totalVentes = todayTickets.reduce((s, t) => s + Number(t.total), 0);
    const ficheCount = todayTickets.length;

    const bouleCount: Record<number, number> = {};
    for (const ticket of todayTickets) {
      for (const l of ticket.lignes || []) {
        bouleCount[l.boule1] = (bouleCount[l.boule1] || 0) + 1;
        bouleCount[l.boule2] = (bouleCount[l.boule2] || 0) + 1;
      }
    }

    const boulesTendance = Object.entries(bouleCount)
      .map(([num, count]) => ({ numero: Number(num), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const dernieresVentes = todayTickets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((t) => ({
        ref: t.ref,
        lignes: t.lignes?.length || 0,
        total: t.total,
        tirage: t.tirage,
        createdAt: t.createdAt,
      }));

    const last7: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const formatter = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/Port-au-Prince',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      last7.push(formatter.format(d));
    }
    const weekTickets = await this.ticketRepository.find({
      where: last7.map(date => ({ vendeurUserId, date })),
    });
    const chartData = last7.map(date => {
      const dayTickets = weekTickets.filter(t => t.date === date);
      const total = dayTickets.reduce((s, t) => s + Number(t.total), 0);
      const d = new Date(date + 'T12:00:00');
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
      return { date, label, total, fiches: dayTickets.length };
    });

    return { totalVentes, ficheCount, commissionRate, boulesTendance, dernieresVentes, chartData };
  }

  async getAdminStats(periode: string, vendeurUserIds?: string[], customDateFrom?: string, customDateTo?: string): Promise<any> {
    const now = new Date();
    const today = this.getTodayHaiti();

    let dateFrom = today;
    let dateTo = today;
    if (customDateFrom && customDateTo) {
      dateFrom = customDateFrom;
      dateTo = customDateTo;
    } else if (periode === 'semaine') {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      dateFrom = d.toISOString().split('T')[0];
    } else if (periode === 'mois') {
      dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    const qb = this.ticketRepository.createQueryBuilder('t')
      .leftJoinAndSelect('t.lignes', 'l')
      .leftJoinAndSelect('t.vendeurUser', 'u')
      .leftJoinAndSelect('t.borlette', 'b')
      .where('t.date >= :dateFrom', { dateFrom })
      .andWhere('t.date <= :dateTo', { dateTo });

    if (vendeurUserIds && vendeurUserIds.length > 0) {
      qb.andWhere('t.vendeur_user_id IN (:...ids)', { ids: vendeurUserIds });
    }

    const tickets = await qb.getMany();

    const recettes = tickets.reduce((s, t) => s + Number(t.total), 0);
    const payes = tickets.filter(t => t.status === TicketStatus.PAYE);
    const paiementsTotal = payes.reduce((s, t) => s + Number(t.total), 0);
    const benefice = recettes - paiementsTotal;
    const ticketCount = tickets.length;

    const vendeurMap: Record<string, { nom: string; ventes: number; tickets: number }> = {};
    for (const t of tickets) {
      const uid = t.vendeurUserId;
      if (!vendeurMap[uid]) {
        vendeurMap[uid] = {
          nom: t.vendeurUser ? `${t.vendeurUser.firstname} ${t.vendeurUser.lastname}` : uid,
          ventes: 0,
          tickets: 0,
        };
      }
      vendeurMap[uid].ventes += Number(t.total);
      vendeurMap[uid].tickets += 1;
    }
    const topVendeurs = Object.values(vendeurMap)
      .sort((a, b) => b.ventes - a.ventes)
      .slice(0, 5);

    const sessionMap: Record<string, { tickets: number; recettes: number; paiements: number; tirage: string; borlette: string }> = {};
    for (const t of tickets) {
      const bName = t.borlette?.nom || 'Inconnu';
      const key = `${bName} · ${t.tirage}`;
      if (!sessionMap[key]) sessionMap[key] = { tickets: 0, recettes: 0, paiements: 0, tirage: t.tirage, borlette: bName };
      sessionMap[key].tickets += 1;
      sessionMap[key].recettes += Number(t.total);
      if (t.status === TicketStatus.PAYE) {
        sessionMap[key].paiements += Number(t.gainTotal || 0);
      }
    }
    const parTirage = Object.entries(sessionMap)
      .map(([nom, d]) => ({ nom, ...d, benefice: d.recettes - d.paiements }))
      .sort((a, b) => b.recettes - a.recettes);

    const chartMap: Record<string, { recettes: number; paiements: number; benefice: number }> = {};
    for (const t of tickets) {
      const d = t.date;
      if (!chartMap[d]) chartMap[d] = { recettes: 0, paiements: 0, benefice: 0 };
      chartMap[d].recettes += Number(t.total);
      if (t.status === TicketStatus.PAYE) {
        chartMap[d].paiements += Number(t.gainTotal || 0);
      }
    }
    const chartData = Object.entries(chartMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => {
        const parts = date.split('-');
        return {
          date: parts.length === 3 ? `${parts[2]}/${parts[1]}` : date,
          recettes: d.recettes,
          paiements: d.paiements,
          benefice: d.recettes - d.paiements,
        };
      });

    // Revenue by tirage per day (for area chart)
    const tirageNames = [...new Set(tickets.map(t => t.tirage))];
    const revenueByTirageMap: Record<string, Record<string, number>> = {};
    for (const t of tickets) {
      const d = t.date;
      if (!revenueByTirageMap[d]) revenueByTirageMap[d] = {};
      revenueByTirageMap[d][t.tirage] = (revenueByTirageMap[d][t.tirage] || 0) + Number(t.total);
    }
    const revenueByTirage = Object.entries(revenueByTirageMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, tirages]) => {
        const parts = date.split('-');
        return {
          date: parts.length === 3 ? `${parts[2]}/${parts[1]}` : date,
          ...tirages,
        };
      });

    // Lotto type split
    const todayTickets = tickets.filter(t => t.date === today);
    let lotto4 = 0;
    let lotto5 = 0;
    for (const t of todayTickets) {
      for (const l of t.lignes || []) {
        if (l.type === LottoType.LOTTO4) lotto4++;
        else lotto5++;
      }
    }

    // Top boules
    const bouleCount: Record<number, number> = {};
    for (const t of todayTickets) {
      for (const l of t.lignes || []) {
        bouleCount[l.boule1] = (bouleCount[l.boule1] || 0) + 1;
        bouleCount[l.boule2] = (bouleCount[l.boule2] || 0) + 1;
      }
    }
    const topBoules = Object.entries(bouleCount)
      .map(([num, count]) => ({ numero: Number(num), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Boules bloquées
    const boulesBloquees = await this.bouleRepository.count({ where: { status: BouleStatus.BLOQUEE } });

    // Recent tickets (last 8)
    const recentTickets = tickets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)
      .map(t => ({
        ref: t.ref,
        vendeur: t.vendeurUser ? `${t.vendeurUser.firstname} ${t.vendeurUser.lastname}` : '',
        total: t.total,
        tirage: t.tirage,
        createdAt: t.createdAt,
      }));

    // Active tirage
    const currentTime = this.getCurrentTimeHaiti();
    const allTirages = await this.tirageRepository.find();
    const activeTirage = allTirages.find(t => currentTime >= t.ouverture && currentTime < t.fermeture);

    const totalVendeurs = await this.vendeurRepository.count();

    return {
      recettes, paiements: paiementsTotal, benefice, ticketCount,
      vendeursActifs: Object.keys(vendeurMap).length,
      totalVendeurs,
      topVendeurs, parTirage, chartData,
      revenueByTirage, tirageNames,
      lotto4, lotto5, topBoules, boulesBloquees, recentTickets,
      tirageActif: activeTirage?.nom || null,
    };
  }

  async getBoulePlayCounts(): Promise<{ numero: number; count: number }[]> {
    const today = this.getTodayHaiti();

    const tickets = await this.ticketRepository.find({
      where: { date: today },
      relations: { lignes: true },
    });

    const counts: Record<number, number> = {};
    for (const ticket of tickets) {
      for (const l of ticket.lignes || []) {
        counts[l.boule1] = (counts[l.boule1] || 0) + 1;
        counts[l.boule2] = (counts[l.boule2] || 0) + 1;
      }
    }

    return Object.entries(counts)
      .map(([num, count]) => ({ numero: Number(num), count }))
      .sort((a, b) => b.count - a.count);
  }

  private format(t: Ticket): any {
    return {
      id: t.id,
      ref: t.ref,
      vendeur: t.vendeurUser ? `${t.vendeurUser.firstname} ${t.vendeurUser.lastname}` : null,
      borlette: t.borlette?.nom || '',
      borletteId: t.borletteId,
      tirage: t.tirage,
      date: t.date,
      total: t.total,
      gainTotal: t.gainTotal,
      status: t.status,
      lignes: t.lignes?.map((l) => ({
        id: l.id,
        numero: l.numero,
        type: l.type,
        boule1: l.boule1,
        boule2: l.boule2,
        prefix: l.prefix,
        option: l.option,
        prix: l.prix,
        status: l.status,
        gain: l.gain,
      })) || [],
      createdAt: t.createdAt,
    };
  }
}

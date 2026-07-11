import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resultat } from './entities/resultat.entity';
import { Ticket, TicketStatus } from '../tickets/entities/ticket.entity';
import { TicketLigne, LottoType, TicketLigneStatus } from '../tickets/entities/ticket-ligne.entity';
import { CreateResultatDto } from './dto/create-resultat.dto';
import { UpdateResultatDto } from './dto/update-resultat.dto';

@Injectable()
export class ResultatsService {
  constructor(
    @InjectRepository(Resultat)
    private readonly resultatRepository: Repository<Resultat>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async create(dto: CreateResultatDto): Promise<any> {
    const exists = await this.resultatRepository.findOne({
      where: { date: dto.date, tirage: dto.tirage, borletteId: dto.borletteId },
    });
    if (exists) {
      throw new ConflictException('Un résultat existe déjà pour cette date, ce tirage et cette borlette');
    }

    const resultat = this.resultatRepository.create(dto);
    const saved = await this.resultatRepository.save(resultat);

    await this.processTickets(dto.date, dto.tirage, dto.borletteId, dto.lot1, dto.lot2, dto.lot3);

    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateResultatDto): Promise<any> {
    const resultat = await this.resultatRepository.findOne({ where: { id } });
    if (!resultat) throw new NotFoundException('Résultat non trouvé');

    await this.resultatRepository.update(id, dto);

    const updated = await this.resultatRepository.findOne({ where: { id }, relations: { borlette: true } });
    if (updated) {
      await this.resetAndReprocessTickets(
        updated.date,
        updated.tirage,
        updated.borletteId,
        dto.lot1 || updated.lot1,
        dto.lot2 || updated.lot2,
        dto.lot3 || updated.lot3,
      );
    }

    return this.findOne(id);
  }

  private async processTickets(
    date: string, tirage: string, borletteId: string,
    lot1: string, lot2: string, lot3: string,
  ): Promise<void> {
    const tickets = await this.ticketRepository.find({
      where: { date, tirage, borletteId, status: TicketStatus.EN_ATTENTE },
      relations: { lignes: true },
    });

    const lot1Boule = parseInt(lot1.substring(lot1.length - 2));

    for (const ticket of tickets) {
      let hasWin = false;
      let gainTotal = 0;
      for (const l of ticket.lignes) {
        const result = this.calculateLigneResult(l, lot1, lot2, lot3, lot1Boule);
        l.status = result.status;
        l.gain = result.gain;
        if (l.status === TicketLigneStatus.GAGNE) hasWin = true;
        gainTotal += Number(l.gain);
      }
      ticket.status = hasWin ? TicketStatus.GAGNE : TicketStatus.PERDU;
      ticket.gainTotal = gainTotal;
      await this.ticketRepository.save(ticket);
    }
  }

  private async resetAndReprocessTickets(
    date: string, tirage: string, borletteId: string,
    lot1: string, lot2: string, lot3: string,
  ): Promise<void> {
    const tickets = await this.ticketRepository.find({
      where: { date, tirage, borletteId },
      relations: { lignes: true },
    });

    const lot1Boule = parseInt(lot1.substring(lot1.length - 2));

    for (const ticket of tickets) {
      let hasWin = false;
      let gainTotal = 0;
      for (const l of ticket.lignes) {
        const result = this.calculateLigneResult(l, lot1, lot2, lot3, lot1Boule);
        l.status = result.status;
        l.gain = result.gain;
        if (l.status === TicketLigneStatus.GAGNE) hasWin = true;
        gainTotal += Number(l.gain);
      }
      ticket.status = hasWin ? TicketStatus.GAGNE : TicketStatus.PERDU;
      ticket.gainTotal = gainTotal;
      await this.ticketRepository.save(ticket);
    }
  }

  private calculateLigneResult(
    ligne: TicketLigne,
    lot1: string, lot2: string, lot3: string,
    lot1Boule: number,
  ): { gain: number, status: TicketLigneStatus } {
    const lot2Num = parseInt(lot2);
    const lot3Num = parseInt(lot3);
    let multiplier = 0;

    if (ligne.type === LottoType.BORLETTE) {
      if (ligne.boule1 === lot1Boule) multiplier += 60;
      if (ligne.boule1 === lot2Num) multiplier += 20;
      if (ligne.boule1 === lot3Num) multiplier += 10;
    } else if (ligne.type === LottoType.MARIAGE) {
      const lotCounts = { [lot1Boule]: 0, [lot2Num]: 0, [lot3Num]: 0 };
      lotCounts[lot1Boule] = (lotCounts[lot1Boule] || 0) + 1;
      lotCounts[lot2Num] = (lotCounts[lot2Num] || 0) + 1;
      lotCounts[lot3Num] = (lotCounts[lot3Num] || 0) + 1;
      if (ligne.boule1 === ligne.boule2) {
        if (lotCounts[ligne.boule1] >= 2) multiplier += 1000;
      } else {
        if (lotCounts[ligne.boule1] >= 1 && lotCounts[ligne.boule2] >= 1) multiplier += 1000;
      }
    } else if (ligne.type === LottoType.BLOTTO3) {
      const num = `${ligne.prefix}${String(ligne.boule1).padStart(2, '0')}`;
      if (num === lot1) multiplier += 500;
    } else if (ligne.type === LottoType.LOTTO4 || ligne.type === LottoType.BLOTTO4) {
      if (ligne.option === 'opt1') {
        if (ligne.boule1 === lot2Num && ligne.boule2 === lot3Num) multiplier += 5000;
      } else if (ligne.option === 'opt2') {
        if (ligne.boule1 === lot1Boule && ligne.boule2 === lot2Num) multiplier += 5000;
      } else if (ligne.option === 'opt3') {
        if (ligne.boule1 === lot1Boule && ligne.boule2 === lot3Num) multiplier += 5000;
      }
    } else if (ligne.type === LottoType.LOTTO5 || ligne.type === LottoType.BLOTTO5) {
      const prefixPlusBoule1 = `${ligne.prefix}${String(ligne.boule1).padStart(2, '0')}`;
      if (ligne.option === 'opt1') {
        if (prefixPlusBoule1 === lot1 && ligne.boule2 === lot2Num) multiplier += 25000;
      } else if (ligne.option === 'opt2') {
        if (prefixPlusBoule1 === lot1 && ligne.boule2 === lot3Num) multiplier += 25000;
      } else if (ligne.option === 'opt3') {
        if (ligne.prefix === parseInt(lot1.slice(-1)) && ligne.boule1 === lot2Num && ligne.boule2 === lot3Num) multiplier += 25000;
      }
    }

    if (ligne.type === LottoType.JACKPOT) {
      if (ligne.boule1 === lot1Boule && ligne.boule2 === lot2Num && ligne.boule3 === lot3Num) {
        return { gain: 1000000, status: TicketLigneStatus.GAGNE };
      }
    }

    const gain = Number(ligne.prix) * multiplier;
    return {
      gain,
      status: multiplier > 0 ? TicketLigneStatus.GAGNE : TicketLigneStatus.PERDU,
    };
  }

  async findAll(): Promise<any[]> {
    const resultats = await this.resultatRepository.find({
      relations: { borlette: true },
      order: { date: 'DESC', tirage: 'ASC' },
    });
    return resultats.map((r) => this.format(r));
  }

  async findOne(id: string): Promise<any> {
    const resultat = await this.resultatRepository.findOne({
      where: { id },
      relations: { borlette: true },
    });
    if (!resultat) throw new NotFoundException('Résultat non trouvé');
    return this.format(resultat);
  }

  async remove(id: string): Promise<void> {
    const result = await this.resultatRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Résultat non trouvé');
  }

  private format(r: Resultat): any {
    return {
      id: r.id,
      date: r.date,
      tirage: r.tirage,
      borletteId: r.borletteId,
      borlette: r.borlette?.nom || '',
      lot1: r.lot1,
      lot2: r.lot2,
      lot3: r.lot3,
      createdAt: r.createdAt,
    };
  }
}

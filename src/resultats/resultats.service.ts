import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resultat } from './entities/resultat.entity';
import { Ticket, TicketStatus } from '../tickets/entities/ticket.entity';
import { TicketLigne, LottoType } from '../tickets/entities/ticket-ligne.entity';
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
      const hasWin = ticket.lignes.some((l) => this.isLigneWinning(l, lot1, lot2, lot3, lot1Boule));
      ticket.status = hasWin ? TicketStatus.GAGNE : TicketStatus.PERDU;
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
      const hasWin = ticket.lignes.some((l) => this.isLigneWinning(l, lot1, lot2, lot3, lot1Boule));
      ticket.status = hasWin ? TicketStatus.GAGNE : TicketStatus.PERDU;
      await this.ticketRepository.save(ticket);
    }
  }

  private isLigneWinning(
    ligne: TicketLigne,
    lot1: string, lot2: string, lot3: string,
    lot1Boule: number,
  ): boolean {
    const lot2Num = parseInt(lot2);
    const lot3Num = parseInt(lot3);

    if (ligne.type === LottoType.JACKPOT) {
      return ligne.boule1 === lot1Boule && ligne.boule2 === lot2Num && ligne.boule3 === lot3Num;
    }

    if (ligne.option === 'opt1') {
      return ligne.boule1 === lot2Num && ligne.boule2 === lot3Num;
    }

    if (ligne.option === 'opt2') {
      if (ligne.type === LottoType.LOTTO5) {
        const prefixPlusBoule1 = `${ligne.prefix}${String(ligne.boule1).padStart(2, '0')}`;
        return prefixPlusBoule1 === lot1 && ligne.boule2 === lot2Num;
      }
      return ligne.boule1 === lot1Boule && ligne.boule2 === lot2Num;
    }

    return false;
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

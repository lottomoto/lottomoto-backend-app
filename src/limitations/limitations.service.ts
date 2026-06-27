import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Limitation } from './entities/limitation.entity';
import { Boule } from '../boules/entities/boule.entity';
import { CreateLimitationDto } from './dto/create-limitation.dto';

@Injectable()
export class LimitationsService {
  constructor(
    @InjectRepository(Limitation)
    private readonly limitationRepository: Repository<Limitation>,
    @InjectRepository(Boule)
    private readonly bouleRepository: Repository<Boule>,
  ) {}

  async create(dto: CreateLimitationDto): Promise<Limitation> {
    const boule = await this.bouleRepository.findOne({ where: { numero: dto.bouleNumero } });
    if (!boule) throw new NotFoundException(`Boule ${dto.bouleNumero} non trouvée`);

    const exists = await this.limitationRepository.findOne({
      where: {
        bouleId: boule.id,
        borlette: dto.borlette,
        tirage: dto.tirage,
        date: dto.date,
      },
    });
    if (exists) {
      throw new ConflictException('Cette limitation existe déjà');
    }

    const limitation = this.limitationRepository.create({
      bouleId: boule.id,
      borlette: dto.borlette,
      tirage: dto.tirage,
      montant: dto.montant,
      date: dto.date,
    });
    return this.limitationRepository.save(limitation);
  }

  async createForAll(bouleNumero: number, montant: number, date: string, borlettes: string[], tirages: string[]): Promise<Limitation[]> {
    const boule = await this.bouleRepository.findOne({ where: { numero: bouleNumero } });
    if (!boule) throw new NotFoundException(`Boule ${bouleNumero} non trouvée`);

    const created: Limitation[] = [];
    for (const borlette of borlettes) {
      for (const tirage of tirages) {
        const exists = await this.limitationRepository.findOne({
          where: { bouleId: boule.id, borlette, tirage, date },
        });
        if (!exists) {
          const lim = this.limitationRepository.create({
            bouleId: boule.id,
            borlette,
            tirage,
            montant,
            date,
          });
          created.push(await this.limitationRepository.save(lim));
        }
      }
    }
    return created;
  }

  async findAll(): Promise<any[]> {
    const limitations = await this.limitationRepository.find({
      relations: { boule: true },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
    return limitations.map((l) => this.format(l));
  }

  async findByBoule(bouleNumero: number): Promise<any[]> {
    const boule = await this.bouleRepository.findOne({ where: { numero: bouleNumero } });
    if (!boule) return [];
    const limitations = await this.limitationRepository.find({
      where: { bouleId: boule.id },
      relations: { boule: true },
      order: { date: 'DESC' },
    });
    return limitations.map((l) => this.format(l));
  }

  async remove(id: string): Promise<void> {
    const result = await this.limitationRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Limitation non trouvée');
  }

  private format(l: Limitation): any {
    return {
      id: l.id,
      bouleNumero: l.boule.numero,
      borlette: l.borlette,
      tirage: l.tirage,
      montant: l.montant,
      date: l.date,
      createdAt: l.createdAt,
    };
  }
}

import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Boule, BouleStatus } from './entities/boule.entity';

@Injectable()
export class BoulesService implements OnModuleInit {
  constructor(
    @InjectRepository(Boule)
    private readonly bouleRepository: Repository<Boule>,
  ) {}

  async onModuleInit() {
    const count = await this.bouleRepository.count();
    if (count === 0) {
      const boules = Array.from({ length: 100 }, (_, i) =>
        this.bouleRepository.create({ numero: i, status: BouleStatus.DISPONIBLE }),
      );
      await this.bouleRepository.save(boules);
    }
  }

  async findAll(): Promise<Boule[]> {
    return this.bouleRepository.find({ order: { numero: 'ASC' } });
  }

  async findOne(numero: number): Promise<Boule> {
    const boule = await this.bouleRepository.findOne({ where: { numero } });
    if (!boule) throw new NotFoundException(`Boule ${numero} non trouvée`);
    return boule;
  }

  async toggleBlock(numero: number): Promise<Boule> {
    const boule = await this.findOne(numero);
    boule.status = boule.status === BouleStatus.BLOQUEE
      ? BouleStatus.DISPONIBLE
      : BouleStatus.BLOQUEE;
    return this.bouleRepository.save(boule);
  }

  async setStatus(numero: number, status: BouleStatus): Promise<Boule> {
    const boule = await this.findOne(numero);
    boule.status = status;
    return this.bouleRepository.save(boule);
  }

  async blockMultiple(numeros: number[]): Promise<Boule[]> {
    const boules = await this.bouleRepository
      .createQueryBuilder('boule')
      .where('boule.numero IN (:...numeros)', { numeros })
      .getMany();
    for (const b of boules) {
      b.status = BouleStatus.BLOQUEE;
    }
    return this.bouleRepository.save(boules);
  }

  async unblockAll(): Promise<void> {
    await this.bouleRepository.update({}, { status: BouleStatus.DISPONIBLE });
  }
}

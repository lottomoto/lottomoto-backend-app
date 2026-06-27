import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Borlette } from './entities/borlette.entity';
import { Tirage } from './entities/tirage.entity';
import { CreateBorletteDto } from './dto/create-borlette.dto';
import { UpdateBorletteDto } from './dto/update-borlette.dto';

@Injectable()
export class BorlettesService {
  constructor(
    @InjectRepository(Borlette)
    private readonly borletteRepository: Repository<Borlette>,
    @InjectRepository(Tirage)
    private readonly tirageRepository: Repository<Tirage>,
  ) {}

  async create(dto: CreateBorletteDto): Promise<Borlette> {
    const existing = await this.borletteRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Ce code existe déjà');

    const borlette = this.borletteRepository.create({
      nom: dto.nom,
      code: dto.code.toUpperCase(),
    });
    const saved = await this.borletteRepository.save(borlette);

    if (dto.tirages?.length) {
      const tirages = dto.tirages.map((t) =>
        this.tirageRepository.create({ nom: t.nom, ouverture: t.ouverture, fermeture: t.fermeture, borletteId: saved.id }),
      );
      await this.tirageRepository.save(tirages);
    }

    return this.findOne(saved.id);
  }

  async findAll(): Promise<Borlette[]> {
    return this.borletteRepository.find({
      relations: { tirages: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Borlette> {
    const borlette = await this.borletteRepository.findOne({
      where: { id },
      relations: { tirages: true },
    });
    if (!borlette) throw new NotFoundException('Borlette non trouvée');
    return borlette;
  }

  async update(id: string, dto: UpdateBorletteDto): Promise<Borlette> {
    const borlette = await this.findOne(id);

    if (dto.code && dto.code !== borlette.code) {
      const existing = await this.borletteRepository.findOne({ where: { code: dto.code } });
      if (existing) throw new ConflictException('Ce code existe déjà');
    }

    if (dto.nom) borlette.nom = dto.nom;
    if (dto.code) borlette.code = dto.code.toUpperCase();
    await this.borletteRepository.save(borlette);

    if (dto.tirages) {
      await this.tirageRepository.delete({ borletteId: id });
      const tirages = dto.tirages.map((t) =>
        this.tirageRepository.create({ nom: t.nom, ouverture: t.ouverture, fermeture: t.fermeture, borletteId: id }),
      );
      await this.tirageRepository.save(tirages);
    }

    return this.findOne(id);
  }

  async toggleActive(id: string): Promise<Borlette> {
    const borlette = await this.findOne(id);
    borlette.isActive = !borlette.isActive;
    await this.borletteRepository.save(borlette);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.borletteRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Borlette non trouvée');
  }
}

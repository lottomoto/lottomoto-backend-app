import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { APP_NAME } from '../common/constants';

const DEFAULTS: Record<string, string> = {
  // Système
  'system.mise_min': '1',
  'system.mise_max': '5000',
  'system.commission': '15',
  'system.tirage_auto': 'true',
  // Entreprise
  'entreprise.nom': APP_NAME,
  'entreprise.adresse': 'Port-au-Prince, Haïti',
  'entreprise.telephone': '+509 2222-3333',
  'entreprise.email': 'contact@ldml.com',
  'entreprise.logo': '',
  // Fiche
  'fiche.show_logo': 'true',
  'fiche.show_entreprise': 'true',
  'fiche.show_tel': 'true',
  'fiche.message': 'Merci pour votre achat. Bonne chance !',
  // Jackpot
  'jackpot.enabled': 'true',
  'jackpot.prix': '100',
  // Sécurité
  'security.2fa': 'true',
};

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async onModuleInit() {
    for (const [key, value] of Object.entries(DEFAULTS)) {
      const exists = await this.settingRepository.findOne({ where: { key } });
      if (!exists) {
        await this.settingRepository.save(
          this.settingRepository.create({ key, value }),
        );
      }
    }
  }

  async getAll(): Promise<Record<string, string>> {
    const settings = await this.settingRepository.find();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async get(key: string): Promise<string | null> {
    const setting = await this.settingRepository.findOne({ where: { key } });
    return setting?.value ?? null;
  }

  async updateMany(updates: Record<string, string>): Promise<Record<string, string>> {
    for (const [key, value] of Object.entries(updates)) {
      const existing = await this.settingRepository.findOne({ where: { key } });
      if (existing) {
        existing.value = value;
        await this.settingRepository.save(existing);
      } else {
        await this.settingRepository.save(
          this.settingRepository.create({ key, value }),
        );
      }
    }
    return this.getAll();
  }
}

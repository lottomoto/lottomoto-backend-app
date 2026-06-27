import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Vendeur } from './entities/vendeur.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateVendeurDto } from './dto/create-vendeur.dto';
import { UpdateVendeurDto } from './dto/update-vendeur.dto';

@Injectable()
export class VendeursService {
  constructor(
    @InjectRepository(Vendeur)
    private readonly vendeurRepository: Repository<Vendeur>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateVendeurDto): Promise<any> {
    const existingUsername = await this.vendeurRepository.findOne({ where: { username: dto.username } });
    if (existingUsername) {
      throw new ConflictException('Ce nom d\'utilisateur existe déjà');
    }

    if (dto.phone) {
      const existingPhone = await this.userRepository.findOne({ where: { phone: dto.phone } });
      if (existingPhone) {
        throw new ConflictException('Ce numéro de téléphone existe déjà');
      }
    }

    const hashedPin = await bcrypt.hash(dto.pin, 10);

    const user = this.userRepository.create({
      firstname: dto.firstname,
      lastname: dto.lastname,
      phone: dto.phone,
      role: UserRole.VENDEUR,
      pin: hashedPin,
      isActive: true,
    });
    const savedUser = await this.userRepository.save(user);

    const vendeur = this.vendeurRepository.create({
      userId: savedUser.id,
      username: dto.username,
      adresse: dto.adresse,
      commission: dto.commission,
    });
    const savedVendeur = await this.vendeurRepository.save(vendeur);

    return this.formatVendeur(savedVendeur, savedUser);
  }

  async findAll(): Promise<any[]> {
    const vendeurs = await this.vendeurRepository.find({ relations: { user: true } });
    return vendeurs.map((v) => this.formatVendeur(v, v.user));
  }

  async findOne(id: string): Promise<any> {
    const vendeur = await this.vendeurRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!vendeur) throw new NotFoundException('Vendeur non trouvé');
    return this.formatVendeur(vendeur, vendeur.user);
  }

  async update(id: string, dto: UpdateVendeurDto): Promise<any> {
    const vendeur = await this.vendeurRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!vendeur) throw new NotFoundException('Vendeur non trouvé');

    if (dto.firstname || dto.lastname || dto.phone || dto.pin) {
      const userUpdates: any = {};
      if (dto.firstname) userUpdates.firstname = dto.firstname;
      if (dto.lastname) userUpdates.lastname = dto.lastname;
      if (dto.phone) {
        const existingPhone = await this.userRepository.findOne({ where: { phone: dto.phone } });
        if (existingPhone && existingPhone.id !== vendeur.userId) {
          throw new ConflictException('Ce numéro de téléphone existe déjà');
        }
        userUpdates.phone = dto.phone;
      }
      if (dto.pin) {
        const hashedPin = await bcrypt.hash(dto.pin, 10);
        userUpdates.pin = hashedPin;
      }
      if (Object.keys(userUpdates).length > 0) {
        await this.userRepository.update(vendeur.userId, userUpdates);
      }
    }

    const vendeurUpdates: any = {};
    if (dto.adresse !== undefined) vendeurUpdates.adresse = dto.adresse;
    if (dto.commission !== undefined) vendeurUpdates.commission = dto.commission;
    if (Object.keys(vendeurUpdates).length > 0) {
      await this.vendeurRepository.update(id, vendeurUpdates);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const vendeur = await this.vendeurRepository.findOne({ where: { id } });
    if (!vendeur) throw new NotFoundException('Vendeur non trouvé');
    await this.vendeurRepository.delete(id);
    await this.userRepository.delete(vendeur.userId);
  }

  async toggleActive(id: string): Promise<any> {
    const vendeur = await this.vendeurRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!vendeur) throw new NotFoundException('Vendeur non trouvé');
    await this.userRepository.update(vendeur.userId, { isActive: !vendeur.user.isActive });
    return this.findOne(id);
  }

  async findByUsername(username: string): Promise<{ vendeur: Vendeur; user: User } | null> {
    const vendeur = await this.vendeurRepository.findOne({
      where: { username },
      relations: { user: true },
    });
    if (!vendeur) return null;
    return { vendeur, user: vendeur.user };
  }

  async updateDeviceId(vendeurId: string, deviceId: string): Promise<void> {
    await this.vendeurRepository.update(vendeurId, { deviceId });
  }

  async resetDeviceId(vendeurId: string): Promise<void> {
    await this.vendeurRepository.update(vendeurId, { deviceId: undefined as any });
  }

  async changePinByUserId(userId: string, newPin: string): Promise<any> {
    const vendeur = await this.vendeurRepository.findOne({
      where: { userId },
      relations: { user: true },
    });
    if (!vendeur) throw new NotFoundException('Vendeur non trouvé');
    const hashedPin = await bcrypt.hash(newPin, 10);
    await this.userRepository.update(vendeur.userId, { pin: hashedPin });
    return { message: 'PIN modifié avec succès' };
  }

  private formatVendeur(vendeur: Vendeur, user: User): any {
    return {
      id: vendeur.id,
      userId: vendeur.userId,
      username: vendeur.username,
      firstname: user.firstname,
      lastname: user.lastname,
      phone: user.phone,
      adresse: vendeur.adresse,
      commission: vendeur.commission,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}

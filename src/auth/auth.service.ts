import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { Succursale } from '../succursales/entities/succursale.entity';
import { UsersService } from '../users/users.service';
import { VendeursService } from '../vendeurs/vendeurs.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Succursale)
    private readonly succursaleRepository: Repository<Succursale>,
    private readonly usersService: UsersService,
    private readonly vendeursService: VendeursService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const tempPassword = crypto.randomBytes(4).toString('hex');

    const user = await this.usersService.create({
      firstname: registerDto.firstname,
      lastname: registerDto.lastname,
      email: registerDto.email,
      phone: registerDto.phone,
      password: tempPassword,
      role: registerDto.role,
    });

    try {
      await this.mailService.sendWelcomeEmail(
        registerDto.email,
        registerDto.firstname,
        tempPassword,
      );
    } catch { /* email failure should not block registration */ }

    return user;
  }

  async loginWithPassword(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    return this.generateTokens(user);
  }

  async loginWithPin(username: string, pin: string, deviceId?: string) {
    const result = await this.vendeursService.findByUsername(username);
    if (!result || !result.user.isActive || !result.user.pin) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const succursale = await this.succursaleRepository.findOne({
      where: { vendeurId: result.vendeur.id },
    });
    if (!succursale) {
      throw new UnauthorizedException('Aucune succursale liée à votre compte');
    }
    if (!succursale.isActive) {
      throw new UnauthorizedException('Votre succursale est désactivée');
    }

    const isMatch = await bcrypt.compare(pin, result.user.pin);
    if (!isMatch) {
      throw new UnauthorizedException('PIN incorrect');
    }

    if (deviceId) {
      if (result.vendeur.deviceId && result.vendeur.deviceId !== deviceId) {
        throw new UnauthorizedException('Ce compte est lié à un autre appareil');
      }
      if (!result.vendeur.deviceId) {
        await this.vendeursService.updateDeviceId(result.vendeur.id, deviceId);
      }
    }

    return this.generateTokens(result.user);
  }

  async verifyPin(userId: string, pin: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.pin) {
      throw new UnauthorizedException('PIN incorrect');
    }
    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) {
      throw new UnauthorizedException('PIN incorrect');
    }
    return { valid: true };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1h

    await this.userRepository.update(user.id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });

    try {
      await this.mailService.sendResetPasswordEmail(email, user.firstname, token);
    } catch { /* */ }

    return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: MoreThan(new Date()),
      },
    });
    if (!user) throw new BadRequestException('Lien invalide ou expiré');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, {
      passwordHash,
      resetPasswordToken: undefined as any,
      resetPasswordExpires: undefined as any,
    });

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Token invalide');
      }
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Token expiré ou invalide');
    }
  }

  private generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' as any }),
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    };
  }
}

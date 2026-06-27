import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Partial<User>> {
    const existsEmail = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existsEmail) {
      throw new ConflictException('Cet email existe déjà');
    }

    if (createUserDto.phone) {
      const existsPhone = await this.userRepository.findOne({
        where: { phone: createUserDto.phone },
      });
      if (existsPhone) {
        throw new ConflictException('Ce numéro de téléphone existe déjà');
      }
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const pin = createUserDto.pin
      ? await bcrypt.hash(createUserDto.pin, 10)
      : undefined;

    const user = this.userRepository.create({
      firstname: createUserDto.firstname,
      lastname: createUserDto.lastname,
      email: createUserDto.email,
      phone: createUserDto.phone,
      role: createUserDto.role,
      passwordHash,
      pin,
    });

    const saved = await this.userRepository.save(user);
    return this.sanitize(saved);
  }

  async findAll(): Promise<Partial<User>[]> {
    const users = await this.userRepository.find();
    return users.map((u) => this.sanitize(u));
  }

  async findOne(id: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return this.sanitize(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const updates: any = { ...updateUserDto };
    if (updateUserDto.password) {
      updates.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
      delete updates.password;
    }
    if (updateUserDto.pin) {
      updates.pin = await bcrypt.hash(updateUserDto.pin, 10);
    }

    await this.userRepository.update(id, updates);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
  }

  private sanitize(user: User): Partial<User> {
    const { passwordHash, pin, resetPasswordToken, resetPasswordExpires, ...rest } = user;
    return rest;
  }
}

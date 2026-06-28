import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log, ActionType } from './entities/log.entity';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,
  ) {}

  async create(data: { action: ActionType; entityType: string; entityId?: string; details?: any; userId?: string }) {
    try {
      const log = this.logRepository.create(data);
      return await this.logRepository.save(log);
    } catch (error) {
      console.error('Error creating log', error);
    }
  }

  async findAll(limit = 50, offset = 0) {
    const [data, total] = await this.logRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { data, total, limit, offset };
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LimitationsService } from './limitations.service';
import { LimitationsController } from './limitations.controller';
import { Limitation } from './entities/limitation.entity';
import { Boule } from '../boules/entities/boule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Limitation, Boule])],
  controllers: [LimitationsController],
  providers: [LimitationsService],
  exports: [LimitationsService],
})
export class LimitationsModule {}

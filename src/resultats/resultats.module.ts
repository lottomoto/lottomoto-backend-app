import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResultatsService } from './resultats.service';
import { ResultatsController } from './resultats.controller';
import { Resultat } from './entities/resultat.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Resultat, Ticket])],
  controllers: [ResultatsController],
  providers: [ResultatsService],
  exports: [ResultatsService],
})
export class ResultatsModule {}

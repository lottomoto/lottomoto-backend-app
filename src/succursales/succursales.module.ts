import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuccursalesService } from './succursales.service';
import { SuccursalesController } from './succursales.controller';
import { Succursale } from './entities/succursale.entity';
import { SuccursaleRapport } from './entities/succursale-rapport.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Vendeur } from '../vendeurs/entities/vendeur.entity';
import { ComptableCollection } from './entities/comptable-collection.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Succursale, SuccursaleRapport, Ticket, Vendeur, ComptableCollection, User])],
  controllers: [SuccursalesController],
  providers: [SuccursalesService],
  exports: [SuccursalesService],
})
export class SuccursalesModule {}

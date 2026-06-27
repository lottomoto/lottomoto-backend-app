import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket } from './entities/ticket.entity';
import { TicketLigne } from './entities/ticket-ligne.entity';
import { Boule } from '../boules/entities/boule.entity';
import { Limitation } from '../limitations/entities/limitation.entity';
import { Tirage } from '../borlettes/entities/tirage.entity';
import { Vendeur } from '../vendeurs/entities/vendeur.entity';
import { Succursale } from '../succursales/entities/succursale.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, TicketLigne, Boule, Limitation, Tirage, Vendeur, Succursale]),
    SettingsModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule { }

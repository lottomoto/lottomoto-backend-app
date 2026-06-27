import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendeursService } from './vendeurs.service';
import { VendeursController } from './vendeurs.controller';
import { Vendeur } from './entities/vendeur.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vendeur, User])],
  controllers: [VendeursController],
  providers: [VendeursService],
  exports: [VendeursService],
})
export class VendeursModule {}

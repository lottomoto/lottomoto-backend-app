import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BorlettesService } from './borlettes.service';
import { BorlettesController } from './borlettes.controller';
import { Borlette } from './entities/borlette.entity';
import { Tirage } from './entities/tirage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Borlette, Tirage])],
  controllers: [BorlettesController],
  providers: [BorlettesService],
  exports: [BorlettesService],
})
export class BorlettesModule {}

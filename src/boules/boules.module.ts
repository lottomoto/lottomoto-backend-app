import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoulesService } from './boules.service';
import { BoulesController } from './boules.controller';
import { Boule } from './entities/boule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Boule])],
  controllers: [BoulesController],
  providers: [BoulesService],
  exports: [BoulesService],
})
export class BoulesModule {}

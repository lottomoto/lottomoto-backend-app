import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Borlette } from '../../borlettes/entities/borlette.entity';

@Entity('resultats')
@Unique(['date', 'tirage', 'borletteId'])
export class Resultat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column()
  tirage: string;

  @ManyToOne(() => Borlette, { eager: true })
  @JoinColumn({ name: 'borlette_id' })
  borlette: Borlette;

  @Column({ name: 'borlette_id' })
  borletteId: string;

  @Column({ length: 3 })
  lot1: string;

  @Column({ length: 2 })
  lot2: string;

  @Column({ length: 2 })
  lot3: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

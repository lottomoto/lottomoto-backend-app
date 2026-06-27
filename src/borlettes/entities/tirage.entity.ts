import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Borlette } from './borlette.entity';

@Entity('tirages')
export class Tirage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column({ type: 'time' })
  ouverture: string;

  @Column({ type: 'time' })
  fermeture: string;

  @ManyToOne(() => Borlette, (b) => b.tirages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'borlette_id' })
  borlette: Borlette;

  @Column({ name: 'borlette_id' })
  borletteId: string;
}

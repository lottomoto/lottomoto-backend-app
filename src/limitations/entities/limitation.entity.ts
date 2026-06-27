import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Boule } from '../../boules/entities/boule.entity';

@Entity('limitations')
export class Limitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Boule, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boule_id' })
  boule: Boule;

  @Column({ name: 'boule_id' })
  bouleId: string;

  @Column()
  borlette: string;

  @Column()
  tirage: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  montant: number;

  @Column({ type: 'date' })
  date: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Succursale } from './succursale.entity';

@Entity('succursale_rapports')
export class SuccursaleRapport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Succursale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'succursale_id' })
  succursale: Succursale;

  @Column({ name: 'succursale_id' })
  succursaleId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashCollecte: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  dette: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

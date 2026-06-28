import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('comptable_collections')
export class ComptableCollection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'superviseur_id' })
  superviseur: User;

  @Column({ name: 'superviseur_id' })
  superviseurId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comptable_id' })
  comptable: User;

  @Column({ name: 'comptable_id' })
  comptableId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashRecu: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  dette: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

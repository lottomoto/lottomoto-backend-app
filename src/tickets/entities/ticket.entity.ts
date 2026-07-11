import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Borlette } from '../../borlettes/entities/borlette.entity';
import { TicketLigne } from './ticket-ligne.entity';

export enum TicketStatus {
  EN_ATTENTE = 'en_attente',
  GAGNE = 'gagne',
  PAYE = 'paye',
  PERDU = 'perdu',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  ref: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'vendeur_user_id' })
  vendeurUser: User;

  @Column({ name: 'vendeur_user_id' })
  vendeurUserId: string;

  @ManyToOne(() => Borlette, { eager: true })
  @JoinColumn({ name: 'borlette_id' })
  borlette: Borlette;

  @Column({ name: 'borlette_id' })
  borletteId: string;

  @Column()
  tirage: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  gainTotal: number;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.EN_ATTENTE })
  status: TicketStatus;

  @OneToMany(() => TicketLigne, (l) => l.ticket, { cascade: true, eager: true })
  lignes: TicketLigne[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

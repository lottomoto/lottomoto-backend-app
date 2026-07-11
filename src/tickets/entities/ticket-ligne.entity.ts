import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';

export enum LottoType {
  LOTTO4 = 'lotto4',
  LOTTO5 = 'lotto5',
  JACKPOT = 'jackpot',
  BORLETTE = 'borlette',
  MARIAGE = 'mariage',
  BLOTTO3 = 'blotto3',
  BLOTTO4 = 'blotto4',
  BLOTTO5 = 'blotto5',
}

export enum TicketLigneStatus {
  EN_ATTENTE = 'en_attente',
  GAGNE = 'gagne',
  PERDU = 'perdu',
}


@Entity('ticket_lignes')
export class TicketLigne {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Ticket, (t) => t.lignes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ name: 'ticket_id' })
  ticketId: string;

  @Column()
  numero: string;

  @Column({ type: 'enum', enum: LottoType })
  type: LottoType;

  @Column()
  boule1: number;

  @Column({ nullable: true })
  boule2: number;

  @Column({ nullable: true })
  prefix: number;

  @Column({ nullable: true })
  boule3: number;

  @Column()
  option: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  prix: number;

  @Column({ type: 'enum', enum: TicketLigneStatus, default: TicketLigneStatus.EN_ATTENTE })
  status: TicketLigneStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  gain: number;
}

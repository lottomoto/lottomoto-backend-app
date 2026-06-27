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

  @Column()
  boule2: number;

  @Column({ nullable: true })
  prefix: number;

  @Column({ nullable: true })
  boule3: number;

  @Column()
  option: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  prix: number;
}

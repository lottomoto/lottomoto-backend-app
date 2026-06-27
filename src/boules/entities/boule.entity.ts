import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BouleStatus {
  DISPONIBLE = 'disponible',
  BLOQUEE = 'bloquee',
}

@Entity('boules')
export class Boule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  numero: number;

  @Column({ type: 'enum', enum: BouleStatus, default: BouleStatus.DISPONIBLE })
  status: BouleStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

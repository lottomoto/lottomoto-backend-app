import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vendeur } from '../../vendeurs/entities/vendeur.entity';

@Entity('succursales')
export class Succursale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column({ nullable: true })
  adresse: string;

  @Column({ unique: true })
  materielId: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'superviseur_id' })
  superviseur: User;

  @Column({ nullable: true, name: 'superviseur_id' })
  superviseurId: string;

  @OneToOne(() => Vendeur, { nullable: true, eager: true })
  @JoinColumn({ name: 'vendeur_id' })
  vendeur: Vendeur;

  @Column({ nullable: true, name: 'vendeur_id' })
  vendeurId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

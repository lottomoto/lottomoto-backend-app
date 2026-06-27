import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tirage } from './tirage.entity';

@Entity('borlettes')
export class Borlette {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column({ length: 3 })
  code: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Tirage, (t) => t.borlette, { cascade: true, eager: true })
  tirages: Tirage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

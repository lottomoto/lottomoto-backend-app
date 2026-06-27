import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('vendeurs')
export class Vendeur {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  adresse: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  commission: number;

  @Column({ nullable: true })
  deviceId: string;
}

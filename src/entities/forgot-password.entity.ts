import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('forgot_password_requests')
export class ForgotPasswordRequest {
  @PrimaryColumn()
  id: string;

  @Column()
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.forgotPasswordRequests, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;
}

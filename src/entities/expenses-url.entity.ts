import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('expenses_urls')
export class ExpensesUrl {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 1024 })
  url: string;

  @Column({ length: 1024 })
  fileName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.expensesUrls, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expense } from './expense.entity';
import { Order } from './order.entity';
import { ForgotPasswordRequest } from './forgot-password.entity';
import { ExpensesUrl } from './expenses-url.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  totalExpense: number;

  @Column({ default: false })
  isPremiumUser: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Expense, (expense) => expense.user, { cascade: true })
  expenses: Expense[];

  @OneToMany(() => Order, (order) => order.user, { cascade: true })
  orders: Order[];

  @OneToMany(() => ForgotPasswordRequest, (fpr) => fpr.user, { cascade: true })
  forgotPasswordRequests: ForgotPasswordRequest[];

  @OneToMany(() => ExpensesUrl, (url) => url.user, { cascade: true })
  expensesUrls: ExpensesUrl[];
}

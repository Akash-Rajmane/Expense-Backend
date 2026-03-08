import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../entities/user.entity';
import { Expense } from '../entities/expense.entity';
import { ExpensesUrl } from '../entities/expenses-url.entity';

@Injectable()
export class PremiumService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(ExpensesUrl)
    private expensesUrlRepository: Repository<ExpensesUrl>,
  ) {}

  async getLeaderboard() {
    const users = await this.userRepository.find({
      order: { totalExpense: 'DESC' },
      select: ['id', 'name', 'totalExpense'],
    });

    return {
      success: true,
      data: users,
      message: 'Got user expenses successfully',
    };
  }

  async getExpensesByInterval(userId: number, interval: string) {
    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    switch (interval) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        throw new BadRequestException('Invalid interval');
    }

    const expenses = await this.expenseRepository.find({
      where: {
        userId,
        createdAt: Between(startDate, endDate),
      },
    });

    if (!expenses || expenses.length === 0) {
      return {
        success: false,
        message: 'No expenses found for the specified interval',
      };
    }

    return {
      success: true,
      data: expenses,
      message: 'Got user expenses by interval successfully',
    };
  }

  async downloadExpenses(userId: number) {
    throw new Error('Feature not available');
  }

  async getDownloadedFilesUrls(userId: number) {
    throw new Error('Feature not available');
  }
}

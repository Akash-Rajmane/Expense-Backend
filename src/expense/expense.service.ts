import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';
import { User } from '../entities/user.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getAllExpensesByUser(userId: number, page: number = 1, limit: number = 5) {
    if (!page) {
      throw new BadRequestException('Page not found!');
    }

    const offset = (page - 1) * limit;

    const [expenses, totalCount] = await Promise.all([
      this.expenseRepository.find({
        where: { userId },
        skip: offset,
        take: limit,
        order: { createdAt: 'DESC' },
      }),
      this.expenseRepository.count({ where: { userId } }),
    ]);

    if (!expenses || expenses.length === 0) {
      return {
        expenses: [],
        currPage: page,
        nextPage: null,
        prevPage: null,
        hasNextPage: false,
        hasPrevPage: false,
        lastPage: 0,
      };
    }

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      expenses,
      currPage: page,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
      hasNextPage,
      hasPrevPage,
      lastPage: totalPages,
    };
  }

  async addExpense(userId: number, createExpenseDto: CreateExpenseDto) {
    const { amount, description, category } = createExpenseDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newExpense = await this.expenseRepository.save({
      amount,
      description,
      category,
      userId,
    });

    user.totalExpense = Number(user.totalExpense) + Number(amount);
    await this.userRepository.save(user);

    return newExpense;
  }

  async deleteExpense(expenseId: number, userId: number) {
    const expense = await this.expenseRepository.findOne({
      where: { id: expenseId, userId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.totalExpense = Number(user.totalExpense) - Number(expense.amount);
    await this.userRepository.save(user);

    await this.expenseRepository.remove(expense);
    return {};
  }
}

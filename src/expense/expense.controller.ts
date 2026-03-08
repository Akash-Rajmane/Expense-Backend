import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../auth/get-user-id.decorator';

@Controller('')
@UseGuards(JwtAuthGuard)
export class ExpenseController {
  constructor(private expenseService: ExpenseService) {}

  @Get('get-expenses')
  async getAllExpenses(
    @UserId() userId: number,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.expenseService.getAllExpensesByUser(userId, page || 1, limit || 5);
  }

  @Post('expenses/add-expense')
  async addExpense(@UserId() userId: number, @Body() createExpenseDto: CreateExpenseDto) {
    return await this.expenseService.addExpense(userId, createExpenseDto);
  }

  @Delete('expenses/:expenseId')
  async deleteExpense(@UserId() userId: number, @Param('expenseId') expenseId: number) {
    return await this.expenseService.deleteExpense(expenseId, userId);
  }
}

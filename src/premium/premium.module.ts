import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PremiumService } from './premium.service';
import { PremiumController } from './premium.controller';
import { User } from '../entities/user.entity';
import { Expense } from '../entities/expense.entity';
import { ExpensesUrl } from '../entities/expenses-url.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Expense, ExpensesUrl]), AuthModule],
  providers: [PremiumService],
  controllers: [PremiumController],
  exports: [PremiumService],
})
export class PremiumModule {}

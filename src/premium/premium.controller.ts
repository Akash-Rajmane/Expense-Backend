import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { PremiumService } from './premium.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PremiumGuard } from '../auth/premium.guard';
import { UserId } from '../auth/get-user-id.decorator';

@Controller('premium')
@UseGuards(JwtAuthGuard, PremiumGuard)
export class PremiumController {
  constructor(private premiumService: PremiumService) {}

  @Get('get-leaderboard')
  async getLeaderboard() {
    return await this.premiumService.getLeaderboard();
  }

  @Get('get-expenses-by-interval/:interval')
  async getExpensesByInterval(@UserId() userId: number, @Param('interval') interval: string) {
    return await this.premiumService.getExpensesByInterval(userId, interval);
  }

  @Get('download-expenses')
  async downloadExpenses(@UserId() userId: number) {
    return await this.premiumService.downloadExpenses(userId);
  }

  @Get('get-downloaded-files-data')
  async getDownloadedFilesUrls(@UserId() userId: number) {
    return await this.premiumService.getDownloadedFilesUrls(userId);
  }
}

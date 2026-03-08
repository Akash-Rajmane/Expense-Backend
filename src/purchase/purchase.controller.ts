import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateTransactionDto, PaymentFailedDto } from './dto/purchase.dto';
import { UserId } from '../auth/get-user-id.decorator';

@Controller('purchase')
@UseGuards(JwtAuthGuard)
export class PurchaseController {
  constructor(private purchaseService: PurchaseService) {}

  @Get('premium-membership')
  async purchasePremium(@UserId() userId: number) {
    return await this.purchaseService.purchasePremium(userId);
  }

  @Post('update-transaction-status')
  async updateTransactionStatus(
    @UserId() userId: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return await this.purchaseService.updateTransactionStatus(
      userId,
      updateTransactionDto.payment_id,
      updateTransactionDto.order_id,
    );
  }

  @Post('payment-failed')
  async paymentFailed(@Body() paymentFailedDto: PaymentFailedDto) {
    return await this.purchaseService.paymentFailed(paymentFailedDto.order_id);
  }
}

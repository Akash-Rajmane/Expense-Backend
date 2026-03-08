import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Razorpay from 'razorpay';
import { User } from '../entities/user.entity';
import { Order } from '../entities/order.entity';

@Injectable()
export class PurchaseService {
  private rzp: Razorpay;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {
    this.rzp = new Razorpay({
      key_id: process.env.RZP_KEY_ID || '',
      key_secret: process.env.RZP_KEY_SECRET || '',
    });
  }

  async purchasePremium(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const amount = 10000; // ₹100 in paise

    return new Promise((resolve, reject) => {
      this.rzp.orders.create({ amount, currency: 'INR' }, async (err, order) => {
        if (err) {
          reject(new BadRequestException(JSON.stringify(err)));
        }

        try {
          const newOrder = await this.orderRepository.save({
            orderId: order.id,
            status: 'PENDING',
            userId,
          });

          resolve({
            order,
            key_id: process.env.RZP_KEY_ID,
          });
        } catch (error) {
          const err = error as { message?: string };
          reject(new BadRequestException(err.message || 'Failed to create order'));
        }
      });
    });
  }

  async updateTransactionStatus(userId: number, payment_id: string, order_id: string) {
    const order = await this.orderRepository.findOne({ where: { orderId: order_id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await Promise.all([
      this.orderRepository.update(order.id, {
        paymentId: payment_id,
        status: 'SUCCESS',
      }),
      this.userRepository.update(userId, { isPremiumUser: true }),
    ]);

    return {
      success: true,
      message: 'Transaction Successful',
    };
  }

  async paymentFailed(order_id: string) {
    const order = await this.orderRepository.findOne({ where: { orderId: order_id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.orderRepository.update(order.id, { status: 'FAILED' });

    return {
      success: true,
      message: 'Payment failed',
    };
  }
}

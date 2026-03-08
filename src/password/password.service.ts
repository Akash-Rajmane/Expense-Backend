import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { createTransport } from 'nodemailer';
import { User } from '../entities/user.entity';
import { ForgotPasswordRequest } from '../entities/forgot-password.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class PasswordService {
  private transporter = createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
      user: 'akashrajmane007@gmail.com',
      pass: process.env.BREVO_SMTP_KEY,
    },
  });

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ForgotPasswordRequest)
    private forgotPasswordRequestRepository: Repository<ForgotPasswordRequest>,
  ) {}

  async postForgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User with given email not found!');
    }

    const data = await this.forgotPasswordRequestRepository.save({
      id: uuidv4(),
      userId: user.id,
      isActive: true,
    });

    const url = `${process.env.FE_HOST}/password/reset-password/${data.id}`;

    const mailOptions = {
      from: 'akashrajmane007@gmail.com',
      to: email,
      subject: 'Reset your password',
      html: `
        <p>Hello,</p>
        <p>You have requested to reset your password for Expense Tracker App. Click the link below to reset it:</p>
        <p><a href="${url}">Reset Password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    };

    this.transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Email error:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    return {
      success: true,
      message: 'Email sent successfully',
    };
  }

  async getResetPassword(uuid: string) {
    const request = await this.forgotPasswordRequestRepository.findOne({
      where: { id: uuid },
    });

    if (!request) {
      throw new NotFoundException('Reset password request not found');
    }

    if (!request.isActive) {
      throw new UnauthorizedException('Reset password request is already expired!');
    }

    return { success: true, message: 'Request is valid' };
  }

  async postUpdatePassword(uuid: string, updatePasswordDto: UpdatePasswordDto) {
    const { password } = updatePasswordDto;

    const request = await this.forgotPasswordRequestRepository.findOne({
      where: { id: uuid },
    });

    if (!request) {
      throw new BadRequestException('Incorrect link');
    }

    request.isActive = false;
    await this.forgotPasswordRequestRepository.save(request);

    const user = await this.userRepository.findOne({ where: { id: request.userId } });
    if (!user) {
      throw new NotFoundException('User not present');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Password updated successfully!',
    };
  }
}

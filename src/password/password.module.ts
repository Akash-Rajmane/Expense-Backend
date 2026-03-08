import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordService } from './password.service';
import { PasswordController } from './password.controller';
import { User } from '../entities/user.entity';
import { ForgotPasswordRequest } from '../entities/forgot-password.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ForgotPasswordRequest])],
  providers: [PasswordService],
  controllers: [PasswordController],
})
export class PasswordModule {}

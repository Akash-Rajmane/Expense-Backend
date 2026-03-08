import { Controller, Get, Post, Body, Param, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import * as path from 'path';
import * as fs from 'fs';
import { PasswordService } from './password.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('password')
export class PasswordController {
  constructor(private passwordService: PasswordService) {}

  @Post('forgot-password')
  async postForgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.passwordService.postForgotPassword(forgotPasswordDto);
  }

  @Get('reset-password/:uuid')
  async getResetPassword(@Param('uuid') uuid: string, @Res() res: FastifyReply) {
    try {
      await this.passwordService.getResetPassword(uuid);
      const filePath = path.join(process.cwd(), 'src', 'views', 'resetPassword.html');
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        res.type('text/html');
        return res.send(fileContent);
      } else {
        return res.status(404).send({ message: 'Reset password page not found' });
      }
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      return res.status(err.status || 500).send({ message: err.message || 'An error occurred' });
    }
  }

  @Post('update-password/:uuid')
  async postUpdatePassword(
    @Param('uuid') uuid: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return await this.passwordService.postUpdatePassword(uuid, updatePasswordDto);
  }
}

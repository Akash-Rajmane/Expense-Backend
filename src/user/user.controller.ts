import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../auth/get-user-id.decorator';

@Controller('')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('add-user')
  async signUp(@Body() createUserDto: CreateUserDto) {
    const result = await this.userService.signUp(createUserDto);
    return {
      message: 'User created successfully',
      user: result.user,
      token: result.token,
      success: true,
    };
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    const result = await this.userService.login(loginUserDto);
    return {
      message: 'Login successful',
      user: result.user,
      token: result.token,
      success: true,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('is-premium-user')
  async getIsPremiumUser(@UserId() userId: number) {
    const result = await this.userService.getIsPremiumUser(userId);
    return result;
  }
}

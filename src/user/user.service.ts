import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(createUserDto: CreateUserDto): Promise<{ user: User; token: string }> {
    const { name, email, password } = createUserDto;

    if (!name || !email || !password) {
      throw new BadRequestException('Please provide name, email, and password');
    }

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.usersRepository.save({
      name,
      email,
      password: hashedPassword,
    });

    const token = this.jwtService.sign(
      { userId: newUser.id, email: newUser.email },
      { expiresIn: '1h' },
    );

    return { user: newUser, token };
  }

  async login(loginUserDto: LoginUserDto): Promise<{ user: User; token: string }> {
    const { email, password } = loginUserDto;

    if (!email || !password) {
      throw new BadRequestException('Please provide email and password');
    }

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ userId: user.id, email: user.email }, { expiresIn: '1h' });

    return { user, token };
  }

  async getIsPremiumUser(userId: number): Promise<{ isPremiumUser: boolean }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return { isPremiumUser: user.isPremiumUser };
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }
}

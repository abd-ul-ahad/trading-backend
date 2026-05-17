import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../database/models/user.model';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Simple hash (use bcrypt in production)
    const hashedPassword = Buffer.from(registerDto.password).toString('base64');

    // Create user
    const user = await this.userModel.create({
      email: registerDto.email,
      fullName: registerDto.fullName,
      password: hashedPassword,
      status: 'active', // Auto-activate for now (can add email verification later)
    });

    this.logger.log(`User registered: ${user.email}`);

    // Generate token (simplified - use JWT in production)
    const token = this.generateToken(user.id);

    return { user, token };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; token: string }> {
    const user = await this.userModel.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password (simple comparison - use bcrypt in production)
    const hashedPassword = Buffer.from(loginDto.password).toString('base64');
    const isPasswordValid = hashedPassword === user.password;

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    this.logger.log(`User logged in: ${user.email}`);

    // Generate token
    const token = this.generateToken(user.id);

    return { user, token };
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userModel.findByPk(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  private generateToken(userId: string): string {
    // Simplified token generation - use JWT in production
    return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
  }
}

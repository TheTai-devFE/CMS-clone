import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.username },
          { email: dto.email },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('Tên đăng nhập hoặc email đã tồn tại');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Kiểm tra xem đây có phải user đầu tiên không để gán làm admin mặc định
    const userCount = await this.prisma.user.count();
    const assignedRole = userCount === 0 ? 'admin' : (dto.role || 'user');

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
        role: assignedRole,
        licenseLimit: dto.licenseLimit !== undefined ? Number(dto.licenseLimit) : 1,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        licenseLimit: true,
        status: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Tài khoản của bạn đang bị khóa');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        licenseLimit: user.licenseLimit,
        status: user.status,
      },
      ...tokens,
    };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'cms_secret_key_change_me_in_production',
      expiresIn: (this.configService.get<string>('JWT_EXPIRATION') as any) || '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'cms_secret_key_change_me_in_production',
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') as any) || '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        licenseLimit: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { randomPassword } from '../common/password.util';

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
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Tên đăng nhập hoặc email đã tồn tại');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const userCount = await this.prisma.user.count();
    const assignedRole = userCount === 0 ? 'admin' : dto.role || 'user';

    const nextNum = userCount + 1;
    const shortId = `USR-${String(nextNum).padStart(4, '0')}`;

    const user = await this.prisma.user.create({
      data: {
        shortId,
        username: dto.username,
        email: dto.email,
        passwordHash,
        role: assignedRole,
        licenseLimit:
          dto.licenseLimit !== undefined ? Number(dto.licenseLimit) : 1,
      },
      select: {
        id: true,
        shortId: true,
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

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
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
        shortId: user.shortId,
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
      secret:
        this.configService.get<string>('JWT_SECRET') ||
        'cms_secret_key_change_me_in_production',
      expiresIn:
        (this.configService.get<string>('JWT_EXPIRATION') as any) || '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret:
        this.configService.get<string>('JWT_SECRET') ||
        'cms_secret_key_change_me_in_production',
      expiresIn:
        (this.configService.get<string>('JWT_REFRESH_EXPIRATION') as any) ||
        '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async getAllUsers() {
    // T6: lấy thêm deviceCount để frontend hiển thị badge Đủ/Vượt/Thiếu.
    // Query tách riêng (thay vì include) để tránh N+1 và giữ type đơn giản.
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        shortId: true,
        username: true,
        email: true,
        role: true,
        licenseLimit: true,
        status: true,
        purchaseType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Đếm devices theo user (chỉ tính approved — pending không chiếm license)
    const deviceCounts = await this.prisma.device.groupBy({
      by: ['userId'],
      where: { approvalStatus: 'approved', userId: { not: null } },
      _count: { _all: true },
    });
    const countMap = new Map(
      deviceCounts.map((d) => [d.userId!, d._count._all]),
    );

    return users.map((u) => ({
      ...u,
      deviceCount: countMap.get(u.id) ?? 0,
    }));
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.passwordHash,
    );
    if (!isOldPasswordValid) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  async updateSecurityPassword(userId: string, securityPassword?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { securityPassword: securityPassword || null },
    });

    return { message: 'Cập nhật mã bảo mật thiết bị thành công' };
  }

  async updateLicenseLimit(
    userId: string,
    newLimit: number,
    requesterRole: string,
    requesterId?: string,
    note?: string,
  ) {
    if (requesterRole !== 'admin') {
      throw new BadRequestException(
        'Chỉ admin mới được thay đổi hạn mức license',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const oldLimit = user.licenseLimit;
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update license
      const updated = await tx.user.update({
        where: { id: userId },
        data: { licenseLimit: newLimit },
        select: {
          id: true,
          shortId: true,
          username: true,
          email: true,
          role: true,
          licenseLimit: true,
          status: true,
          purchaseType: true,
        },
      });

      // 2. T6: Ghi audit log
      if (oldLimit !== newLimit) {
        await tx.licenseAudit.create({
          data: {
            userId,
            changedById: requesterId,
            action: 'license_limit',
            oldValue: String(oldLimit),
            newValue: String(newLimit),
            note: note?.slice(0, 500) || null,
          },
        });
      }

      return updated;
    });

    return result;
  }

  /**
   * T2: Admin tạo user mới với mật khẩu tự sinh.
   * Trả về tempPassword chỉ 1 LẦN DUY NHẤT qua response.
   * Frontend PHẢI hiển thị modal để admin copy và gửi cho user qua email.
   *
   * @throws ForbiddenException nếu không phải admin
   * @throws ConflictException nếu email/username đã tồn tại
   */
  async createUserByAdmin(
    dto: CreateUserDto,
    requesterRole: string,
  ): Promise<{
    user: {
      id: string;
      shortId: string;
      username: string;
      email: string;
      role: string;
      licenseLimit: number;
      status: string;
      createdAt: Date;
    };
    tempPassword: string;
  }> {
    if (requesterRole !== 'admin') {
      throw new ForbiddenException('Chỉ admin mới có quyền tạo người dùng');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Tên đăng nhập hoặc email đã tồn tại');
    }

    // Sinh mật khẩu ngẫu nhiên
    const tempPassword = randomPassword(12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const userCount = await this.prisma.user.count();
    const nextNum = userCount + 1;
    const shortId = `USR-${String(nextNum).padStart(4, '0')}`;

    const user = await this.prisma.user.create({
      data: {
        shortId,
        username: dto.username,
        email: dto.email,
        passwordHash,
        role: dto.role || 'user',
        licenseLimit: dto.licenseLimit ?? 1,
        // T6: mặc định purchaseType = 'rent' (thuê bao). Admin có thể đổi sau.
        purchaseType: 'rent',
      },
      select: {
        id: true,
        shortId: true,
        username: true,
        email: true,
        role: true,
        licenseLimit: true,
        status: true,
        purchaseType: true,
        createdAt: true,
      },
    });

    // TODO T17: Gửi email credentials qua Resend sau khi webhook payment thành công.
    // Hiện tại MVP: chỉ return cho admin copy thủ công.

    return { user, tempPassword };
  }
}

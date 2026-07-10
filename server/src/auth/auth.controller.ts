import { Body, Controller, Get, Post, Put, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
  }

  @Post('security-password')
  @UseGuards(JwtAuthGuard)
  async updateSecurityPassword(
    @CurrentUser() user: any,
    @Body() dto: { securityPassword?: string },
  ) {
    return this.authService.updateSecurityPassword(
      user.id,
      dto.securityPassword,
    );
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Put('users/:id/license')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateLicenseLimit(
    @Param('id') userId: string,
    @Body() dto: { licenseLimit: number },
    @CurrentUser() user: any,
  ) {
    return this.authService.updateLicenseLimit(userId, dto.licenseLimit, user.role);
  }
}

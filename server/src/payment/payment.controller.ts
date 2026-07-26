import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/interfaces/current-user.interface';

@Controller('api/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout')
  async createCheckout(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.paymentService.createCheckout(user.id, dto);
  }

  @Post('webhook')
  async handleWebhook(@Body() body: Record<string, unknown>) {
    return this.paymentService.handleWebhook(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  async getUserOrders(@CurrentUser() user: CurrentUserType) {
    if (user.role === 'admin') {
      return this.paymentService.getAllOrders();
    }
    return this.paymentService.getUserOrders(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:orderCode')
  async getOrderByCode(
    @CurrentUser() user: CurrentUserType,
    @Param('orderCode') orderCode: string,
  ) {
    return this.paymentService.getOrderByCode(user.id, orderCode);
  }
}

import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout')
  async createCheckout(@Req() req: any, @Body() dto: CreateCheckoutDto) {
    return this.paymentService.createCheckout(req.user.id, dto);
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    return this.paymentService.handleWebhook(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  async getUserOrders(@Req() req: any) {
    return this.paymentService.getUserOrders(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:orderCode')
  async getOrderByCode(@Req() req: any, @Param('orderCode') orderCode: string) {
    return this.paymentService.getOrderByCode(req.user.id, orderCode);
  }
}

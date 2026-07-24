import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

// Giá license đợt 1 (VND):
// Rent (Thuê): 99,000 VND / màn hình
// Buy (Mua đứt): 1,500,000 VND / màn hình
const PRICE_PER_UNIT = {
  rent: 99000,
  buy: 1500000,
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private payOS: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID');
    const apiKey = this.configService.get<string>('PAYOS_API_KEY');
    const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY');

    if (clientId && apiKey && checksumKey) {
      this.payOS = new PayOS({ clientId, apiKey, checksumKey });
      this.logger.log('PayOS initialized successfully');
    } else {
      this.logger.warn(
        'PayOS keys missing in environment variables. Running in mock mode.',
      );
    }
  }

  async createCheckout(userId: string, dto: CreateCheckoutDto) {
    const { licenseQuantity, purchaseType } = dto;
    const unitPrice = PRICE_PER_UNIT[purchaseType];
    const amount = licenseQuantity * unitPrice;

    // Mã đơn hàng độc nhất dạng BigInt (timestamp 6 chữ số + random 3 chữ số)
    const orderCode = Number(
      String(Date.now()).slice(-6) +
        String(Math.floor(100 + Math.random() * 900)),
    );

    const order = await this.prisma.order.create({
      data: {
        orderCode: BigInt(orderCode),
        userId,
        amount,
        licenseQuantity,
        purchaseType,
        status: 'PENDING',
      },
    });

    const returnUrl =
      this.configService.get<string>('PAYOS_RETURN_URL') ||
      'http://localhost:3000/dashboard?payment=success';
    const cancelUrl =
      this.configService.get<string>('PAYOS_CANCEL_URL') ||
      'http://localhost:3000/dashboard?payment=cancelled';

    let checkoutUrl = '';
    let paymentLinkResponse: any = null;

    if (this.payOS) {
      try {
        const body = {
          orderCode,
          amount,
          description: `CMS Signage ${licenseQuantity} Slot`,
          returnUrl,
          cancelUrl,
        };
        paymentLinkResponse = await this.payOS.paymentRequests.create(body);
        checkoutUrl = paymentLinkResponse.checkoutUrl;
      } catch (err: any) {
        this.logger.error(
          `Error creating PayOS payment link: ${err.message}`,
          err.stack,
        );
        throw new BadRequestException(
          `Không thể tạo liên kết thanh toán PayOS: ${err.message}`,
        );
      }
    } else {
      // Mock mode khi chưa cấu hình Key PayOS thực tế
      checkoutUrl = `http://localhost:3000/dashboard?mock_payment=true&orderCode=${orderCode}`;
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        checkoutUrl,
        paymentLinkResponse: paymentLinkResponse || {},
      },
    });

    return {
      orderId: order.id,
      orderCode: orderCode.toString(),
      amount,
      licenseQuantity,
      purchaseType,
      checkoutUrl,
    };
  }

  async handleWebhook(webhookBody: any) {
    this.logger.log(
      `Received PayOS webhook payload: ${JSON.stringify(webhookBody)}`,
    );

    let verifiedData: any = webhookBody.data;

    if (this.payOS && webhookBody.signature) {
      try {
        verifiedData = this.payOS.webhooks.verify(webhookBody);
      } catch (err: any) {
        this.logger.error(
          `PayOS Webhook Signature verification failed: ${err.message}`,
        );
        throw new BadRequestException('Chữ ký webhook không hợp lệ');
      }
    }

    if (!verifiedData) {
      return { success: false, message: 'No webhook data' };
    }

    const {
      orderCode,
      amount,
      reference,
      accountNumber,
      transactionDateTime,
      code,
    } = verifiedData;

    if (code !== '00' && webhookBody.success !== true) {
      this.logger.warn(`Payment not successful for orderCode ${orderCode}`);
      return { success: false, message: 'Payment status not code 00' };
    }

    const order = await this.prisma.order.findUnique({
      where: { orderCode: BigInt(orderCode) },
      include: { user: true },
    });

    if (!order) {
      this.logger.error(`Order not found for orderCode: ${orderCode}`);
      throw new NotFoundException(`Đơn hàng #${orderCode} không tồn tại`);
    }

    if (order.status === 'PAID') {
      this.logger.log(`Order #${orderCode} already processed as PAID.`);
      return { success: true, message: 'Already processed' };
    }

    // Thực hiện Transaction cập nhật trạng thái đơn hàng & cộng License Limit
    await this.prisma.$transaction(async (tx) => {
      // 1. Đánh dấu Order là PAID
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      });

      // 2. Tạo bản ghi PaymentTransaction
      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          reference: reference || null,
          amount: amount || order.amount,
          accountNumber: accountNumber || null,
          transactionDateTime: transactionDateTime
            ? new Date(transactionDateTime)
            : new Date(),
          webhookData: webhookBody,
        },
      });

      const oldLimit = order.user.licenseLimit;
      const newLimit = oldLimit + order.licenseQuantity;

      // 3. Cập nhật User licenseLimit & purchaseType
      await tx.user.update({
        where: { id: order.userId },
        data: {
          licenseLimit: newLimit,
          purchaseType: order.purchaseType,
        },
      });

      // 4. Ghi vết LicenseAudit
      await tx.licenseAudit.create({
        data: {
          userId: order.userId,
          changedById: null, // System / PayOS Automatic
          action: 'license_limit',
          oldValue: String(oldLimit),
          newValue: String(newLimit),
          note: `Tự động nạp ${order.licenseQuantity} slot màn hình qua PayOS (Đơn hàng #${orderCode})`,
        },
      });
    });

    this.logger.log(
      `Successfully upgraded user ${order.userId} license limit to ${order.user.licenseLimit + order.licenseQuantity}`,
    );

    return { success: true, orderCode: orderCode.toString() };
  }

  async getUserOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        payments: true,
      },
    });

    return orders.map((o) => ({
      ...o,
      orderCode: o.orderCode.toString(),
    }));
  }

  async getOrderByCode(userId: string, orderCodeStr: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderCode: BigInt(orderCodeStr) },
      include: { payments: true },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return {
      ...order,
      orderCode: order.orderCode.toString(),
    };
  }
}

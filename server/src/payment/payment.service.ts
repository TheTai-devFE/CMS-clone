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
  private payOS: PayOS | null = null;

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
    let paymentLinkResponse: Record<string, unknown> | null = null;

    if (this.payOS) {
      try {
        const body = {
          orderCode,
          amount,
          description: `CMS Signage ${licenseQuantity} Slot`,
          returnUrl,
          cancelUrl,
        };
        const resp = (await this.payOS.paymentRequests.create(body)) as { checkoutUrl?: string };
        paymentLinkResponse = resp as unknown as Record<string, unknown>;
        checkoutUrl = resp.checkoutUrl || '';
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Error creating PayOS payment link: ${errorMsg}`,
        );
        throw new BadRequestException(
          `Không thể tạo liên kết thanh toán PayOS: ${errorMsg}`,
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
        paymentLinkResponse: (paymentLinkResponse || {}) as Record<string, string | number | boolean>,
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

  async handleWebhook(webhookBody: Record<string, unknown>) {
    this.logger.log(
      `Received PayOS webhook payload: ${JSON.stringify(webhookBody)}`,
    );

    let verifiedData: Record<string, any> | null = (webhookBody.data as Record<string, any>) || null;

    if (this.payOS && webhookBody.signature) {
      try {
        const result = await this.payOS.webhooks.verify(webhookBody as any);
        verifiedData = result as Record<string, any>;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `PayOS Webhook Signature verification failed: ${errorMsg}`,
        );
        throw new BadRequestException('Chữ ký webhook không hợp lệ');
      }
    }

    if (!verifiedData) {
      return { success: false, message: 'No webhook data' };
    }

    const orderCode = String(verifiedData.orderCode || '');
    const amount = Number(verifiedData.amount || 0);
    const reference = verifiedData.reference ? String(verifiedData.reference) : null;
    const accountNumber = verifiedData.accountNumber ? String(verifiedData.accountNumber) : null;
    const transactionDateTime = verifiedData.transactionDateTime;
    const code = String(verifiedData.code || '');

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
          reference,
          amount: amount || order.amount,
          accountNumber,
          transactionDateTime: transactionDateTime
            ? new Date(transactionDateTime as string | number | Date)
            : new Date(),
          webhookData: (webhookBody || {}) as Record<string, string | number | boolean>,
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

    return { success: true, orderCode };
  }

  async getAllOrders() {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            shortId: true,
            username: true,
            email: true,
          },
        },
        payments: true,
      },
    });

    return orders.map((o) => ({
      ...o,
      orderCode: o.orderCode.toString(),
    }));
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

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class TemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTemplateDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Tạo Template
      const template = await tx.template.create({
        data: {
          userId,
          name: dto.name,
          width: dto.width ?? 1920,
          height: dto.height ?? 1080,
          orientation: dto.orientation ?? 'landscape',
        },
      });

      // 2. Tạo các phân vùng (Zones) nếu có
      if (dto.zones && dto.zones.length > 0) {
        const zonesData = dto.zones.map((zone) => ({
          templateId: template.id,
          name: zone.name,
          type: zone.type,
          x: zone.x,
          y: zone.y,
          width: zone.width,
          height: zone.height,
          contentData: (zone.contentData ?? {}) as unknown as Prisma.InputJsonValue,
        }));

        await tx.zone.createMany({
          data: zonesData,
        });
      }

      // Trả về chi tiết template vừa tạo kèm zones
      return tx.template.findUnique({
        where: { id: template.id },
        include: { zones: true },
      });
    });
  }

  async findAll(userId: string, role: string) {
    const where = role === 'admin' ? {} : { userId };
    return this.prisma.template.findMany({
      where,
      include: {
        zones: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string, role: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: { zones: true },
    });

    if (!template) {
      throw new NotFoundException('Không tìm thấy bố cục hiển thị');
    }

    if (role !== 'admin' && template.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập bố cục này');
    }

    return template;
  }

  async update(
    id: string,
    dto: CreateTemplateDto,
    userId: string,
    role: string,
  ) {
    const template = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Không tìm thấy bố cục để cập nhật');
    }

    if (role !== 'admin' && template.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bố cục này');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật thông tin cơ bản của Template
      const updatedTemplate = await tx.template.update({
        where: { id },
        data: {
          name: dto.name,
          width: dto.width ?? template.width,
          height: dto.height ?? template.height,
          orientation: dto.orientation ?? template.orientation,
        },
      });

      // 2. Đồng bộ các Zone: Xóa toàn bộ zone cũ và tạo lại các zone mới
      if (dto.zones) {
        await tx.zone.deleteMany({
          where: { templateId: id },
        });

        if (dto.zones.length > 0) {
          const zonesData = dto.zones.map((zone) => ({
            templateId: id,
            name: zone.name,
            type: zone.type,
            x: zone.x,
            y: zone.y,
            width: zone.width,
            height: zone.height,
          contentData: (zone.contentData ?? {}) as unknown as Prisma.InputJsonValue,
          }));

          await tx.zone.createMany({
            data: zonesData,
          });
        }
      }

      // Trả về template đầy đủ sau khi update
      return tx.template.findUnique({
        where: { id },
        include: { zones: true },
      });
    });
  }

  async remove(id: string, userId: string, role: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Không tìm thấy bố cục để xóa');
    }

    if (role !== 'admin' && template.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bố cục này');
    }

    // Cascade delete trong Prisma schema sẽ tự động xóa các zones liên quan trong DB
    return this.prisma.template.delete({
      where: { id },
    });
  }
}

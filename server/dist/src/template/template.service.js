"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TemplateService = class TemplateService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, userId) {
        return this.prisma.$transaction(async (tx) => {
            const template = await tx.template.create({
                data: {
                    userId,
                    name: dto.name,
                    width: dto.width ?? 1920,
                    height: dto.height ?? 1080,
                    orientation: dto.orientation ?? 'landscape',
                },
            });
            if (dto.zones && dto.zones.length > 0) {
                const zonesData = dto.zones.map((zone) => ({
                    templateId: template.id,
                    name: zone.name,
                    type: zone.type,
                    x: zone.x,
                    y: zone.y,
                    width: zone.width,
                    height: zone.height,
                    contentData: zone.contentData ?? {},
                }));
                await tx.zone.createMany({
                    data: zonesData,
                });
            }
            return tx.template.findUnique({
                where: { id: template.id },
                include: { zones: true },
            });
        });
    }
    async findAll(userId, role) {
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
    async findOne(id, userId, role) {
        const template = await this.prisma.template.findUnique({
            where: { id },
            include: { zones: true },
        });
        if (!template) {
            throw new common_1.NotFoundException('Không tìm thấy bố cục hiển thị');
        }
        if (role !== 'admin' && template.userId !== userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền truy cập bố cục này');
        }
        return template;
    }
    async update(id, dto, userId, role) {
        const template = await this.prisma.template.findUnique({
            where: { id },
        });
        if (!template) {
            throw new common_1.NotFoundException('Không tìm thấy bố cục để cập nhật');
        }
        if (role !== 'admin' && template.userId !== userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền chỉnh sửa bố cục này');
        }
        return this.prisma.$transaction(async (tx) => {
            const updatedTemplate = await tx.template.update({
                where: { id },
                data: {
                    name: dto.name,
                    width: dto.width ?? template.width,
                    height: dto.height ?? template.height,
                    orientation: dto.orientation ?? template.orientation,
                },
            });
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
                        contentData: zone.contentData ?? {},
                    }));
                    await tx.zone.createMany({
                        data: zonesData,
                    });
                }
            }
            return tx.template.findUnique({
                where: { id },
                include: { zones: true },
            });
        });
    }
    async remove(id, userId, role) {
        const template = await this.prisma.template.findUnique({
            where: { id },
        });
        if (!template) {
            throw new common_1.NotFoundException('Không tìm thấy bố cục để xóa');
        }
        if (role !== 'admin' && template.userId !== userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền xóa bố cục này');
        }
        return this.prisma.template.delete({
            where: { id },
        });
    }
};
exports.TemplateService = TemplateService;
exports.TemplateService = TemplateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TemplateService);
//# sourceMappingURL=template.service.js.map
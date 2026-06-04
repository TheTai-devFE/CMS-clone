"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma_service_1 = require("../prisma/prisma.service");
let MediaService = class MediaService {
    prisma;
    configService;
    uploadDir;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.uploadDir = this.configService.get('UPLOAD_DIR') || './uploads';
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }
    async saveUploadedFile(file, userId) {
        if (!file) {
            throw new common_1.BadRequestException('Không có tệp tin được tải lên');
        }
        const tempFilePath = file.path;
        try {
            const checksum = await this.calculateFileMd5(tempFilePath);
            const existingMedia = await this.prisma.media.findFirst({
                where: { checksum },
            });
            const ext = path.extname(file.originalname).toLowerCase();
            const finalFileName = `${checksum}${ext}`;
            const finalFilePath = path.join(this.uploadDir, finalFileName);
            if (!fs.existsSync(finalFilePath)) {
                fs.renameSync(tempFilePath, finalFilePath);
            }
            else {
                fs.unlinkSync(tempFilePath);
            }
            const fileUrl = `/uploads/${finalFileName}`;
            if (existingMedia && existingMedia.userId === userId) {
                return existingMedia;
            }
            const media = await this.prisma.media.create({
                data: {
                    userId,
                    fileName: file.originalname,
                    fileUrl,
                    fileSize: BigInt(file.size),
                    mimeType: file.mimetype,
                    checksum,
                },
            });
            return {
                ...media,
                fileSize: media.fileSize.toString(),
            };
        }
        catch (error) {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
            throw error;
        }
    }
    async getUserMedia(userId, role) {
        const whereClause = role === 'admin' ? {} : { userId };
        const mediaList = await this.prisma.media.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });
        return mediaList.map((media) => ({
            ...media,
            fileSize: media.fileSize.toString(),
        }));
    }
    async deleteMedia(id, userId, role) {
        const media = await this.prisma.media.findUnique({
            where: { id },
        });
        if (!media) {
            throw new common_1.NotFoundException('Không tìm thấy tệp tin');
        }
        if (role !== 'admin' && media.userId !== userId) {
            throw new common_1.UnauthorizedException('Bạn không có quyền xóa tệp tin này');
        }
        await this.prisma.media.delete({
            where: { id },
        });
        const otherReferences = await this.prisma.media.count({
            where: { checksum: media.checksum },
        });
        if (otherReferences === 0) {
            const fileName = path.basename(media.fileUrl);
            const filePath = path.join(this.uploadDir, fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        return { success: true };
    }
    calculateFileMd5(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('md5');
            const stream = fs.createReadStream(filePath);
            stream.on('data', (data) => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', (err) => reject(err));
        });
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], MediaService);
//# sourceMappingURL=media.service.js.map
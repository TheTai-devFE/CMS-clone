import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class MediaService {
    private readonly prisma;
    private readonly configService;
    private readonly uploadDir;
    constructor(prisma: PrismaService, configService: ConfigService);
    saveUploadedFile(file: Express.Multer.File, userId: string): Promise<any>;
    getUserMedia(userId: string, role: string): Promise<any>;
    deleteMedia(id: string, userId: string, role: string): Promise<{
        success: boolean;
    }>;
    private calculateFileMd5;
}

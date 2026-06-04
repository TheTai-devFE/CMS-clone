import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class MediaService {
    private readonly prisma;
    private readonly configService;
    private readonly uploadDir;
    constructor(prisma: PrismaService, configService: ConfigService);
    saveUploadedFile(file: Express.Multer.File, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        fileName: string;
        fileUrl: string;
        fileSize: bigint;
        mimeType: string;
        checksum: string;
    } | {
        fileSize: string;
        id: string;
        createdAt: Date;
        userId: string;
        fileName: string;
        fileUrl: string;
        mimeType: string;
        checksum: string;
    }>;
    getUserMedia(userId: string, role: string): Promise<{
        fileSize: string;
        id: string;
        createdAt: Date;
        userId: string;
        fileName: string;
        fileUrl: string;
        mimeType: string;
        checksum: string;
    }[]>;
    deleteMedia(id: string, userId: string, role: string): Promise<{
        success: boolean;
    }>;
    private calculateFileMd5;
}

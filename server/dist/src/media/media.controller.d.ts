import { MediaService } from './media.service';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    uploadFile(file: Express.Multer.File, user: any): Promise<{
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
    getMedia(user: any): Promise<{
        fileSize: string;
        id: string;
        createdAt: Date;
        userId: string;
        fileName: string;
        fileUrl: string;
        mimeType: string;
        checksum: string;
    }[]>;
    deleteMedia(id: string, user: any): Promise<{
        success: boolean;
    }>;
}

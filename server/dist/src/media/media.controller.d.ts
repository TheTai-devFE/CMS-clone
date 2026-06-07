import { MediaService } from './media.service';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    uploadFile(file: Express.Multer.File, user: any): Promise<any>;
    getMedia(user: any): Promise<any>;
    deleteMedia(id: string, user: any): Promise<{
        success: boolean;
    }>;
}

import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MediaService {
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads';
    // Đảm bảo thư mục upload tồn tại
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveUploadedFile(file: Express.Multer.File, userId: string) {
    if (!file) {
      throw new BadRequestException('Không có tệp tin được tải lên');
    }

    const tempFilePath = file.path;

    try {
      // 1. Tính toán MD5 Checksum từ file vật lý vừa lưu tạm
      const checksum = await this.calculateFileMd5(tempFilePath);

      // 2. Kiểm tra xem file với checksum này đã tồn tại trong DB chưa
      const existingMedia = await this.prisma.media.findFirst({
        where: { checksum },
      });

      const ext = path.extname(file.originalname).toLowerCase();
      const finalFileName = `${checksum}${ext}`;
      const finalFilePath = path.join(this.uploadDir, finalFileName);

      // Nếu tệp vật lý chưa tồn tại trên đĩa, di chuyển file từ thư mục tạm sang file chính thức
      if (!fs.existsSync(finalFilePath)) {
        fs.renameSync(tempFilePath, finalFilePath);
      } else {
        // Nếu file đã tồn tại trên đĩa (trùng checksum), xóa file tạm vừa upload đi để tiết kiệm bộ nhớ
        fs.unlinkSync(tempFilePath);
      }

      // Tạo đường dẫn URL tĩnh để truy cập file
      // URL sẽ trỏ về route static assets ví dụ: /uploads/xxxxxx.mp4
      const fileUrl = `/uploads/${finalFileName}`;

      // Nếu đã có bản ghi trong DB của User hiện tại, trả về luôn để tránh trùng lặp
      if (existingMedia && existingMedia.userId === userId) {
        return existingMedia;
      }

      // Lưu bản ghi mới vào Database
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
        fileSize: media.fileSize.toString(), // Chuyển BigInt thành String để tránh lỗi JSON serialize
      };
    } catch (error) {
      // Nếu có lỗi, đảm bảo xóa file tạm nếu còn tồn tại
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }
  }

  async getUserMedia(userId: string, role: string) {
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

  async deleteMedia(id: string, userId: string, role: string) {
    const media = await this.prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException('Không tìm thấy tệp tin');
    }

    if (role !== 'admin' && media.userId !== userId) {
      throw new UnauthorizedException('Bạn không có quyền xóa tệp tin này');
    }

    // Xóa bản ghi trong DB
    await this.prisma.media.delete({
      where: { id },
    });

    // Kiểm tra xem còn thiết bị hay user nào khác đang tham chiếu đến checksum này không
    const otherReferences = await this.prisma.media.count({
      where: { checksum: media.checksum },
    });

    // Nếu không còn bản ghi nào khác dùng chung file này, tiến hành xóa file vật lý trên đĩa
    if (otherReferences === 0) {
      const fileName = path.basename(media.fileUrl);
      const filePath = path.join(this.uploadDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return { success: true };
  }

  // Helper function tính toán MD5 của file một cách bất tuần tự (stream) để tránh quá tải RAM
  private calculateFileMd5(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  }
}

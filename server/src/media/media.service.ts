import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import sharp from 'sharp';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class MediaService {
  private readonly storageType: string;
  private readonly uploadDir: string;
  private s3Client: S3Client | null = null;
  private r2BucketName: string;
  private r2PublicUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.storageType =
      this.configService.get<string>('STORAGE_TYPE') || 'local';
    this.uploadDir =
      this.configService.get<string>('UPLOAD_DIR') || './uploads';

    // Đảm bảo thư mục upload tạm/local tồn tại
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    if (this.storageType === 'r2') {
      const accessKeyId = this.configService.get<string>(
        'CLOUDFLARE_R2_ACCESS_KEY_ID',
      );
      const secretAccessKey = this.configService.get<string>(
        'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
      );
      const endpoint = this.configService.get<string>('CLOUDFLARE_R2_ENDPOINT');
      this.r2BucketName =
        this.configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME') ||
        'cms-media';
      this.r2PublicUrl =
        this.configService.get<string>('CLOUDFLARE_R2_PUBLIC_URL') || '';

      if (!accessKeyId || !secretAccessKey || !endpoint) {
        throw new Error(
          'Missing Cloudflare R2 configurations in environment variables',
        );
      }

      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  async saveUploadedFile(file: Express.Multer.File, userId: string) {
    if (!file) {
      throw new BadRequestException('Không có tệp tin được tải lên');
    }

    let tempFilePath = file.path;

    // Tự động tối ưu hóa hình ảnh bằng sharp (loại trừ ảnh GIF động)
    const ext = path.extname(file.originalname).toLowerCase();
    const isImage = file.mimetype.startsWith('image/');
    const isGif = ext === '.gif';

    if (isImage && !isGif) {
      try {
        const compressedFileName = `${path.basename(file.filename, ext)}-compressed.webp`;
        const compressedTempPath = path.join(
          path.dirname(tempFilePath),
          compressedFileName,
        );

        // Nén ảnh, tự động resize nếu chiều ngang vượt quá 3840px (4K) và convert sang WebP quality 80
        await sharp(tempFilePath)
          .resize({
            width: 3840,
            withoutEnlargement: true,
            fit: 'inside',
          })
          .webp({ quality: 80 })
          .toFile(compressedTempPath);

        // Xóa tệp tạm chưa nén
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }

        // Cập nhật lại thông tin file
        tempFilePath = compressedTempPath;
        file.path = compressedTempPath;
        file.mimetype = 'image/webp';

        // Thay thế đuôi mở rộng của originalname thành .webp
        const originalBaseName = path.basename(file.originalname, ext);
        file.originalname = `${originalBaseName}.webp`;

        // Cập nhật lại kích thước file
        const stats = fs.statSync(compressedTempPath);
        file.size = stats.size;
      } catch (err) {
        console.error('Lỗi khi tối ưu hóa hình ảnh bằng Sharp:', err);
        // Nếu nén lỗi thì tiếp tục quy trình lưu file gốc, không chặn upload
      }
    }

    try {
      // 1. Tính toán MD5 Checksum từ file vật lý vừa lưu tạm
      const checksum = await this.calculateFileMd5(tempFilePath);

      // 2. Kiểm tra xem file với checksum này đã tồn tại trong DB chưa
      const existingMedia = await this.prisma.media.findFirst({
        where: { checksum },
      });

      const updatedExt = path.extname(file.originalname).toLowerCase();
      const finalFileName = `${checksum}${updatedExt}`;
      const finalFilePath = path.join(this.uploadDir, finalFileName);

      let fileUrl = '';
      if (this.storageType === 'r2') {
        const fileKey = finalFileName;
        // Nếu file chưa tồn tại (chưa có media nào với checksum này trong hệ thống), ta thực hiện upload lên Cloudflare R2
        if (!existingMedia) {
          const fileBuffer = fs.readFileSync(tempFilePath);
          if (!this.s3Client) {
            throw new Error('Cloudflare R2 client is not initialized');
          }
          await this.s3Client.send(
            new PutObjectCommand({
              Bucket: this.r2BucketName,
              Key: fileKey,
              Body: fileBuffer,
              ContentType: file.mimetype,
            }),
          );
        }
        // Xóa file tạm local sau khi đã upload hoặc nếu file đã tồn tại
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        // Tạo file URL trỏ đến public URL của Cloudflare R2
        const baseUrl = this.r2PublicUrl.endsWith('/')
          ? this.r2PublicUrl.slice(0, -1)
          : this.r2PublicUrl;
        fileUrl = `${baseUrl}/${fileKey}`;
      } else {
        // Nếu tệp vật lý chưa tồn tại trên đĩa, di chuyển file từ thư mục tạm sang file chính thức
        if (!fs.existsSync(finalFilePath)) {
          fs.renameSync(tempFilePath, finalFilePath);
        } else {
          // Nếu file đã tồn tại trên đĩa (trùng checksum), xóa file tạm vừa upload đi để tiết kiệm bộ nhớ
          fs.unlinkSync(tempFilePath);
        }
        fileUrl = `/uploads/${finalFileName}`;
      }

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

  async saveWebUrl(name: string, url: string, userId: string) {
    if (!name || !url) {
      throw new BadRequestException(
        'Tên hiển thị và Web URL không được để trống',
      );
    }

    // Tạo checksum md5 từ URL để tránh trùng lặp
    const checksum = crypto.createHash('md5').update(url).digest('hex');

    // Kiểm tra xem đã tồn tại bản ghi URL này chưa cho User hiện tại
    const existingMedia = await this.prisma.media.findFirst({
      where: { checksum, userId },
    });

    if (existingMedia) {
      return {
        ...existingMedia,
        fileSize: existingMedia.fileSize.toString(),
      };
    }

    const media = await this.prisma.media.create({
      data: {
        userId,
        fileName: name,
        fileUrl: url,
        fileSize: BigInt(0),
        mimeType: 'url',
        checksum,
      },
    });

    return {
      ...media,
      fileSize: media.fileSize.toString(),
    };
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

    // Nếu không còn bản ghi nào khác dùng chung file này, tiến hành xóa file vật lý
    if (otherReferences === 0) {
      const fileName = path.basename(media.fileUrl);
      if (this.storageType === 'r2') {
        if (this.s3Client) {
          try {
            await this.s3Client.send(
              new DeleteObjectCommand({
                Bucket: this.r2BucketName,
                Key: fileName,
              }),
            );
          } catch (err) {
            console.error('Lỗi khi xóa tệp trên Cloudflare R2:', err);
          }
        }
      } else {
        const filePath = path.join(this.uploadDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
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

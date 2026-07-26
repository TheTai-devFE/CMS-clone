import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { exec } from 'child_process';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const execPromise = util.promisify(exec);

@Injectable()
export class VideoWallSlicerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private async getVideoDimensions(filePath: string): Promise<{ width: number; height: number }> {
    try {
      const { stdout } = await execPromise(
        `/opt/homebrew/bin/ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${filePath}"`,
      );
      const parts = stdout.trim().split('x');
      if (parts.length === 2) {
        const width = parseInt(parts[0], 10);
        const height = parseInt(parts[1], 10);
        if (!isNaN(width) && !isNaN(height)) return { width, height };
      }
      throw new Error('Kích thước video không hợp lệ');
    } catch {
      return { width: 1920, height: 1080 };
    }
  }

  private async getVideoDuration(filePath: string): Promise<number> {
    try {
      const { stdout } = await execPromise(
        `/opt/homebrew/bin/ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      );
      const duration = parseFloat(stdout.trim());
      return !isNaN(duration) ? Math.ceil(duration) : 10;
    } catch {
      return 10;
    }
  }

  private async sliceVideo(
    inputPath: string,
    outputPath: string,
    width: number,
    height: number,
    x: number,
    y: number,
  ): Promise<void> {
    const cmd = `/opt/homebrew/bin/ffmpeg -y -i "${inputPath}" -vf "crop=${width}:${height}:${x}:${y}" -c:v libx264 -crf 23 -an "${outputPath}"`;
    try {
      await execPromise(cmd);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      throw new BadRequestException('Không thể cắt video bằng FFmpeg: ' + errMsg);
    }
  }

  private calculateFileMd5(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  }

  async processVideoWallSlicing(
    playlistId: string,
    sourceMediaId: string,
    rows: number,
    cols: number,
    userId: string,
  ) {
    const sourceMedia = await this.prisma.media.findUnique({
      where: { id: sourceMediaId },
    });
    if (!sourceMedia) {
      throw new NotFoundException('Không tìm thấy video nguồn');
    }

    const storageType = this.configService.get<string>('STORAGE_TYPE') || 'local';
    const uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads';

    let sourcePath = '';
    let isTempSourceDownloaded = false;

    if (storageType === 'r2') {
      const tempSourceFileName = `downloaded_source_${crypto.randomUUID()}_${path.basename(sourceMedia.fileUrl)}`;
      sourcePath = path.join(uploadDir, tempSourceFileName);
      try {
        const response = await fetch(sourceMedia.fileUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        fs.writeFileSync(sourcePath, Buffer.from(arrayBuffer));
        isTempSourceDownloaded = true;
      } catch {
        throw new BadRequestException('Không thể tải video nguồn từ Cloudflare R2');
      }
    } else {
      sourcePath = path.join(uploadDir, path.basename(sourceMedia.fileUrl));
      if (!fs.existsSync(sourcePath)) {
        throw new BadRequestException('Tệp video nguồn không tồn tại');
      }
    }

    const { width, height } = await this.getVideoDimensions(sourcePath);
    const duration = await this.getVideoDuration(sourcePath);
    const sliceWidth = Math.floor(width / cols);
    const sliceHeight = Math.floor(height / rows);

    const newPlaylistItems: { mediaId: string; sortOrder: number; duration: number }[] = [];

    try {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const slotIndex = row * cols + col + 1;
          const tempOutputName = `temp_${playlistId}_slot_${slotIndex}.mp4`;
          const tempOutputPath = path.join(uploadDir, tempOutputName);

          await this.sliceVideo(sourcePath, tempOutputPath, sliceWidth, sliceHeight, col * sliceWidth, row * sliceHeight);
          const checksum = await this.calculateFileMd5(tempOutputPath);
          const finalFileName = `${checksum}.mp4`;
          const finalFilePath = path.join(uploadDir, finalFileName);
          const fileSize = fs.statSync(tempOutputPath).size;
          let fileUrl = `/uploads/${finalFileName}`;

          if (storageType === 'r2') {
            const accessKeyId = this.configService.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID');
            const secretAccessKey = this.configService.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
            const endpoint = this.configService.get<string>('CLOUDFLARE_R2_ENDPOINT');
            const r2BucketName = this.configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME') || 'cms-media';
            const r2PublicUrl = this.configService.get<string>('CLOUDFLARE_R2_PUBLIC_URL') || '';

            const s3Client = new S3Client({
              region: 'auto',
              endpoint,
              credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
            });

            const existsInDb = await this.prisma.media.findFirst({ where: { checksum } });
            if (!existsInDb) {
              await s3Client.send(new PutObjectCommand({ Bucket: r2BucketName, Key: finalFileName, Body: fs.readFileSync(tempOutputPath), ContentType: 'video/mp4' }));
            }
            if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
            fileUrl = `${r2PublicUrl.replace(/\/$/, '')}/${finalFileName}`;
          } else {
            if (!fs.existsSync(finalFilePath)) fs.renameSync(tempOutputPath, finalFilePath);
            else fs.unlinkSync(tempOutputPath);
          }

          let mediaRecord = await this.prisma.media.findFirst({ where: { checksum } });
          if (!mediaRecord) {
            mediaRecord = await this.prisma.media.create({
              data: { userId, fileName: `Wall_${slotIndex}_${sourceMedia.fileName}`, fileUrl, fileSize: BigInt(fileSize), mimeType: 'video/mp4', checksum },
            });
          }

          newPlaylistItems.push({ mediaId: mediaRecord.id, sortOrder: slotIndex, duration });
        }
      }
    } finally {
      if (isTempSourceDownloaded && fs.existsSync(sourcePath)) {
        try { fs.unlinkSync(sourcePath); } catch {}
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.playlistItem.deleteMany({ where: { playlistId } });
      await tx.playlistItem.createMany({
        data: newPlaylistItems.map((item) => ({
          id: crypto.randomUUID(),
          playlistId,
          mediaId: item.mediaId,
          sortOrder: item.sortOrder,
          duration: item.duration,
          transitionEffect: 'none',
        })),
      });
    });
  }
}

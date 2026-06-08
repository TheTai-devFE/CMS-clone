import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const playlistId = '0fe1aeff-5a6a-4e3b-a6b5-f2c6ac6e03b8';
  const mediaIds = [
    'c75bd1cb-6ae5-4ab9-aff5-7be62cf7072e',
    '2791e35a-24a1-469d-80aa-5cbe453a5702',
  ];

  console.log('--- Bắt đầu kiểm tra dữ liệu ---');

  // 1. Kiểm tra Playlist tồn tại
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
  });
  console.log('Playlist tồn tại:', !!playlist);

  // 2. Kiểm tra các Media tồn tại
  for (const mId of mediaIds) {
    const media = await prisma.media.findUnique({
      where: { id: mId },
    });
    console.log(`Media ${mId} tồn tại:`, !!media);
  }

  // 3. Chạy thử transaction để xem lỗi chính xác từ PostgreSQL/Prisma
  console.log('\n--- Thử chạy transaction để lấy chi tiết lỗi ---');
  try {
    await prisma.$transaction(async (tx) => {
      // Xóa cũ
      await tx.playlistItem.deleteMany({
        where: { playlistId },
      });

      // Tạo mới
      const createData = mediaIds.map((mediaId, idx) => ({
        playlistId,
        mediaId,
        sortOrder: idx + 1,
        duration: idx === 0 ? 2 : 6,
        transitionEffect: 'none',
      }));

      console.log('Data to insert:', createData);
      await tx.playlistItem.createMany({
        data: createData,
      });
    });
    console.log('Chạy thử thành công! Không có lỗi DB.');
  } catch (error) {
    console.error('LỖI THỰC TẾ TỪ DATABASE:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Bắt đầu test xóa Playlist ---');
  try {
    // 1. Lấy một playlist ngẫu nhiên
    const playlists = await prisma.playlist.findMany({
      take: 5,
      include: {
        schedules: true,
        playlistItems: true,
      }
    });

    console.log(`Tìm thấy ${playlists.length} playlists.`);
    if (playlists.length === 0) {
      console.log('Không có playlist nào để test.');
      return;
    }

    for (const pl of playlists) {
      console.log(`\nPlaylist: ID=${pl.id}, Name="${pl.playlistName}"`);
      console.log(`- Items: ${pl.playlistItems.length}`);
      console.log(`- Schedules: ${pl.schedules.length}`);
    }

    // 2. Tạo một playlist dummy và thử xóa nó
    console.log('\nTạo playlist nháp để test xóa...');
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('Không có user nào trong DB.');
      return;
    }

    const testPl = await prisma.playlist.create({
      data: {
        userId: user.id,
        playlistName: 'Test Delete Playlist ' + Date.now(),
        description: 'Temporary playlist for testing delete cascade',
      }
    });
    console.log('Đã tạo playlist test ID:', testPl.id);

    // Tạo item cho playlist test
    const media = await prisma.media.findFirst();
    if (media) {
      await prisma.playlistItem.create({
        data: {
          playlistId: testPl.id,
          mediaId: media.id,
          sortOrder: 1,
        }
      });
      console.log('Đã liên kết media item vào playlist test');
    }

    // Thử xóa playlist vừa tạo
    console.log('Đang thử xóa playlist test...');
    await prisma.playlist.delete({
      where: { id: testPl.id }
    });
    console.log('Xóa playlist test thành công!');

  } catch (error) {
    console.error('LỖI THỰC TẾ KHI XÓA PLAYLIST:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

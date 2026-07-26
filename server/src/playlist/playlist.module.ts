import { Module } from '@nestjs/common';
import { PlaylistController } from './playlist.controller';
import { PlaylistService } from './playlist.service';
import { VideoWallSlicerService } from './video-wall-slicer.service';
import { PlaylistSyncService } from './playlist-sync.service';
import { PlaylistScheduleService } from './playlist-schedule.service';

@Module({
  controllers: [PlaylistController],
  providers: [
    PlaylistService,
    VideoWallSlicerService,
    PlaylistSyncService,
    PlaylistScheduleService,
  ],
  exports: [
    PlaylistService,
    VideoWallSlicerService,
    PlaylistSyncService,
    PlaylistScheduleService,
  ],
})
export class PlaylistModule {}

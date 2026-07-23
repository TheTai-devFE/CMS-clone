import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddPlaylistItemsDto } from './dto/add-playlist-items.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { PublishPlaylistDto } from './dto/publish-playlist.dto';
import { PlaylistService } from './playlist.service';

interface AuthUser {
  id: string;
  role: string;
  email?: string;
}

@Controller()
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  // ==========================================
  // ENDPOINT DÀNH CHO PLAYER (KHÔNG CẦN AUTH)
  // ==========================================

  @Get('api/player/sync')
  async syncDevice(
    @Query('deviceId') deviceId: string,
    @Query('apiKey') apiKey: string,
  ) {
    return this.playlistService.getSyncPlaylistForDevice(deviceId, apiKey);
  }

  /**
   * Endpoint re-sync thời gian cho sync group.
   * Client gọi định kỳ (mỗi 30-60s) để lấy lại mốc syncPlayDeadline
   * và tự seek lại nếu bị trôi frame so với các device khác.
   */
  @Get('api/player/sync-time')
  async getSyncTime(
    @Query('deviceId') deviceId: string,
    @Query('apiKey') apiKey: string,
    @Query('playlistId') playlistId: string,
  ) {
    return this.playlistService.getSyncTimeForDevice(
      deviceId,
      apiKey,
      playlistId,
    );
  }

  // ==========================================
  // ENDPOINTS QUẢN LÝ PLAYLIST (YÊU CẦU AUTH)
  // ==========================================

  @Post('api/playlists')
  @UseGuards(JwtAuthGuard)
  async createPlaylist(
    @Body() dto: CreatePlaylistDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.playlistService.createPlaylist(dto, user.id);
  }

  @Put('api/playlists/:id')
  @UseGuards(JwtAuthGuard)
  async updatePlaylist(
    @Param('id') id: string,
    @Body() dto: UpdatePlaylistDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.playlistService.updatePlaylist(id, dto, user.id, user.role);
  }

  @Get('api/playlists')
  @UseGuards(JwtAuthGuard)
  async getPlaylists(@CurrentUser() user: AuthUser) {
    return this.playlistService.getPlaylists(user.id, user.role);
  }

  @Get('api/playlists/:id/items')
  @UseGuards(JwtAuthGuard)
  async getPlaylistItems(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.playlistService.getPlaylistItems(id, user.id, user.role);
  }

  @Post('api/playlists/:id/items')
  @UseGuards(JwtAuthGuard)
  async addPlaylistItems(
    @Param('id') id: string,
    @Body() dto: AddPlaylistItemsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.playlistService.addPlaylistItems(id, dto, user.id, user.role);
  }

  @Delete('api/playlists/:id')
  @UseGuards(JwtAuthGuard)
  async deletePlaylist(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.playlistService.deletePlaylist(id, user.id, user.role);
  }

  /**
   * T5: Publish playlist tới danh sách device.
   * Body: { devices: [{ deviceId, enabled }], scheduleName? }
   * Sau khi publish, player sẽ pick up playlist ngay lập tức qua
   * /api/player/sync (vì Schedule active mọi ngày trong tuần).
   */
  @Post('api/playlists/:id/publish')
  @UseGuards(JwtAuthGuard)
  async publishPlaylist(
    @Param('id') id: string,
    @Body() dto: PublishPlaylistDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.playlistService.publishPlaylist(
      id,
      user.id,
      user.role,
      dto.devices,
      dto.scheduleName,
    );
  }

  // ==========================================
  // ENDPOINTS QUẢN LÝ LỊCH TRÌNH (YÊU CẦU AUTH)
  // ==========================================

  @Post('api/schedules')
  @UseGuards(JwtAuthGuard)
  async createSchedule(
    @Body() dto: CreateScheduleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.playlistService.createSchedule(dto, user.id);
  }

  @Get('api/schedules')
  @UseGuards(JwtAuthGuard)
  async getSchedules(@CurrentUser() user: AuthUser) {
    return this.playlistService.getSchedules(user.id, user.role);
  }

  @Put('api/schedules/:id')
  @UseGuards(JwtAuthGuard)
  async updateSchedule(
    @Param('id') id: string,
    @Body() dto: CreateScheduleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.playlistService.updateSchedule(id, dto, user.id, user.role);
  }

  @Delete('api/schedules/:id')
  @UseGuards(JwtAuthGuard)
  async deleteSchedule(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.playlistService.deleteSchedule(id, user.id, user.role);
  }
}

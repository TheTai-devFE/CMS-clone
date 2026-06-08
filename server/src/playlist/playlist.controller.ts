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
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const add_playlist_items_dto_1 = require("./dto/add-playlist-items.dto");
const create_playlist_dto_1 = require("./dto/create-playlist.dto");
const create_schedule_dto_1 = require("./dto/create-schedule.dto");
const playlist_service_1 = require("./playlist.service");
let PlaylistController = class PlaylistController {
    playlistService;
    constructor(playlistService) {
        this.playlistService = playlistService;
    }
    async syncDevice(deviceId, apiKey) {
        return this.playlistService.getSyncPlaylistForDevice(deviceId, apiKey);
    }
    async createPlaylist(dto, user) {
        return this.playlistService.createPlaylist(dto, user.id);
    }
    async getPlaylists(user) {
        return this.playlistService.getPlaylists(user.id, user.role);
    }
    async getPlaylistItems(id, user) {
        return this.playlistService.getPlaylistItems(id, user.id, user.role);
    }
    async addPlaylistItems(id, dto, user) {
        return this.playlistService.addPlaylistItems(id, dto, user.id, user.role);
    }
    async deletePlaylist(id, user) {
        return this.playlistService.deletePlaylist(id, user.id, user.role);
    }
    async createSchedule(dto, user) {
        return this.playlistService.createSchedule(dto, user.id);
    }
    async getSchedules(user) {
        return this.playlistService.getSchedules(user.id, user.role);
    }
};
exports.PlaylistController = PlaylistController;
__decorate([
    (0, common_1.Get)('api/player/sync'),
    __param(0, (0, common_1.Query)('deviceId')),
    __param(1, (0, common_1.Query)('apiKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PlaylistController.prototype, "syncDevice", null);
__decorate([
    (0, common_1.Post)('api/playlists'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_playlist_dto_1.CreatePlaylistDto, Object]),
    __metadata("design:returntype", Promise)
], PlaylistController.prototype, "createPlaylist", null);
__decorate([
    (0, common_1.Get)('api/playlists'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlaylistController.prototype, "getPlaylists", null);
__decorate([
    (0, common_1.Get)('api/playlists/:id/items'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PlaylistController.prototype, "getPlaylistItems", null);
__decorate([
    (0, common_1.Post)('api/playlists/:id/items'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_playlist_items_dto_1.AddPlaylistItemsDto, Object]),
    __metadata("design:returntype", Promise)
], PlaylistController.prototype, "addPlaylistItems", null);
__decorate([
    (0, common_1.Delete)('api/playlists/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PlaylistController.prototype, "deletePlaylist", null);
__decorate([
    (0, common_1.Post)('api/schedules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_schedule_dto_1.CreateScheduleDto, Object]),
    __metadata("design:returntype", Promise)
], PlaylistController.prototype, "createSchedule", null);
__decorate([
    (0, common_1.Get)('api/schedules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlaylistController.prototype, "getSchedules", null);
exports.PlaylistController = PlaylistController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [playlist_service_1.PlaylistService])
], PlaylistController);
//# sourceMappingURL=playlist.controller.js.map
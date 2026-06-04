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
exports.DeviceController = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const device_service_1 = require("./device.service");
const assign_device_dto_1 = require("./dto/assign-device.dto");
const heartbeat_dto_1 = require("./dto/heartbeat.dto");
const register_device_dto_1 = require("./dto/register-device.dto");
let DeviceController = class DeviceController {
    deviceService;
    constructor(deviceService) {
        this.deviceService = deviceService;
    }
    async registerDevice(dto, ip) {
        return this.deviceService.register(dto, ip);
    }
    async heartbeat(dto) {
        return this.deviceService.heartbeat(dto);
    }
    async getUserDevices(user) {
        if (user.role === 'admin') {
            return this.deviceService.getAllDevices();
        }
        return this.deviceService.getUserDevices(user.id);
    }
    async getSystemLogs(user) {
        return this.deviceService.getSystemLogs(user);
    }
    async deleteDevice(id, user) {
        if (user.role !== 'admin') {
            const userDevices = await this.deviceService.getUserDevices(user.id);
            const isOwner = userDevices.some((d) => d.id === id);
            if (!isOwner) {
                throw new common_1.NotFoundException('Không tìm thấy thiết bị hoặc bạn không có quyền xóa');
            }
        }
        return this.deviceService.deleteDevice(id);
    }
    async getPendingDevices() {
        return this.deviceService.getPendingDevices();
    }
    async assignDevice(id, dto) {
        return this.deviceService.assignDevice(id, dto.userId);
    }
};
exports.DeviceController = DeviceController;
__decorate([
    (0, common_1.Post)('api/player/register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_device_dto_1.RegisterDeviceDto, String]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "registerDevice", null);
__decorate([
    (0, common_1.Post)('api/player/heartbeat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [heartbeat_dto_1.HeartbeatDto]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Get)('api/devices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "getUserDevices", null);
__decorate([
    (0, common_1.Get)('api/devices/logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "getSystemLogs", null);
__decorate([
    (0, common_1.Delete)('api/devices/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "deleteDevice", null);
__decorate([
    (0, common_1.Get)('api/admin/devices/pending'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "getPendingDevices", null);
__decorate([
    (0, common_1.Put)('api/admin/devices/:id/assign'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_device_dto_1.AssignDeviceDto]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "assignDevice", null);
exports.DeviceController = DeviceController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [device_service_1.DeviceService])
], DeviceController);
//# sourceMappingURL=device.controller.js.map
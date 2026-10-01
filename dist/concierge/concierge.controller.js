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
exports.ConciergeController = void 0;
const common_1 = require("@nestjs/common");
const concierge_service_1 = require("./concierge.service");
const auth_service_1 = require("../auth/auth.service");
let ConciergeController = class ConciergeController {
    constructor(conciergeService, authService) {
        this.conciergeService = conciergeService;
        this.authService = authService;
    }
    getAuthenticatedUserId(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Jeton d\'authentification manquant ou invalide.');
        }
        const token = authHeader.split(' ')[1];
        const userPayload = this.authService.validateToken(token);
        return userPayload.userId;
    }
    async createRequest(authHeader, actionType, serviceName) {
        const userId = this.getAuthenticatedUserId(authHeader);
        if (!actionType) {
            throw new common_1.BadRequestException('Le type d\'action est obligatoire (activation, suspension, resiliation).');
        }
        if (!serviceName) {
            throw new common_1.BadRequestException('Le nom du service cible est obligatoire.');
        }
        return this.conciergeService.createRequest(userId, actionType, serviceName);
    }
    async getRequests(authHeader) {
        const userId = this.getAuthenticatedUserId(authHeader);
        return this.conciergeService.getRequests(userId);
    }
    async completeRequest(authHeader, id) {
        this.getAuthenticatedUserId(authHeader);
        if (!id) {
            throw new common_1.BadRequestException('L\'identifiant de la demande est requis.');
        }
        return this.conciergeService.completeRequest(id);
    }
    async getAlerts(authHeader) {
        const userId = this.getAuthenticatedUserId(authHeader);
        return this.conciergeService.getAlerts(userId);
    }
};
exports.ConciergeController = ConciergeController;
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)('actionType')),
    __param(2, (0, common_1.Body)('serviceName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ConciergeController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)('requests'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ConciergeController.prototype, "getRequests", null);
__decorate([
    (0, common_1.Post)('admin/complete/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConciergeController.prototype, "completeRequest", null);
__decorate([
    (0, common_1.Get)('alerts'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ConciergeController.prototype, "getAlerts", null);
exports.ConciergeController = ConciergeController = __decorate([
    (0, common_1.Controller)('concierge'),
    __metadata("design:paramtypes", [concierge_service_1.ConciergeService,
        auth_service_1.AuthService])
], ConciergeController);
//# sourceMappingURL=concierge.controller.js.map
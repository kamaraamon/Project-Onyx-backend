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
exports.ExchangeController = void 0;
const common_1 = require("@nestjs/common");
const exchange_service_1 = require("./exchange.service");
const auth_service_1 = require("../auth/auth.service");
let ExchangeController = class ExchangeController {
    constructor(exchangeService, authService) {
        this.exchangeService = exchangeService;
        this.authService = authService;
    }
    getAuthenticatedUser(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Jeton d\'authentification manquant ou invalide.');
        }
        const token = authHeader.split(' ')[1];
        return this.authService.validateToken(token);
    }
    async proposeExchange(authHeader, offeredSubName, wantedSubName) {
        const user = this.getAuthenticatedUser(authHeader);
        if (!offeredSubName) {
            throw new common_1.BadRequestException('Le nom du service proposé est obligatoire.');
        }
        if (!wantedSubName) {
            throw new common_1.BadRequestException('Le nom du service recherché est obligatoire.');
        }
        return this.exchangeService.proposeExchange(user.userId, user.phone, offeredSubName, wantedSubName);
    }
    async getListings() {
        return this.exchangeService.getListings();
    }
    async acceptExchange(authHeader, id) {
        const user = this.getAuthenticatedUser(authHeader);
        if (!id) {
            throw new common_1.BadRequestException('L\'identifiant de la proposition d\'échange est requis.');
        }
        return this.exchangeService.acceptExchange(user.userId, id);
    }
    async getTrustScore(authHeader) {
        const user = this.getAuthenticatedUser(authHeader);
        const score = await this.exchangeService.getTrustScore(user.userId);
        return { trustScore: score };
    }
    async reportUser(authHeader, targetUserId, reason) {
        this.getAuthenticatedUser(authHeader);
        if (!targetUserId) {
            throw new common_1.BadRequestException('L\'identifiant de l\'utilisateur à signaler est obligatoire.');
        }
        if (!reason) {
            throw new common_1.BadRequestException('La raison du signalement est obligatoire.');
        }
        return this.exchangeService.reportUser(targetUserId, reason);
    }
    async claimBackup(authHeader, exchangeId) {
        const user = this.getAuthenticatedUser(authHeader);
        if (!exchangeId) {
            throw new common_1.BadRequestException('L\'identifiant de l\'échange concerné est requis.');
        }
        return this.exchangeService.claimBackupProfile(user.userId, exchangeId);
    }
};
exports.ExchangeController = ExchangeController;
__decorate([
    (0, common_1.Post)('propose'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)('offeredSubName')),
    __param(2, (0, common_1.Body)('wantedSubName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "proposeExchange", null);
__decorate([
    (0, common_1.Get)('listings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "getListings", null);
__decorate([
    (0, common_1.Post)('accept/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "acceptExchange", null);
__decorate([
    (0, common_1.Get)('trust-score'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "getTrustScore", null);
__decorate([
    (0, common_1.Post)('report'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)('targetUserId')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "reportUser", null);
__decorate([
    (0, common_1.Post)('claim-backup'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)('exchangeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ExchangeController.prototype, "claimBackup", null);
exports.ExchangeController = ExchangeController = __decorate([
    (0, common_1.Controller)('exchange'),
    __metadata("design:paramtypes", [exchange_service_1.ExchangeService,
        auth_service_1.AuthService])
], ExchangeController);
//# sourceMappingURL=exchange.controller.js.map
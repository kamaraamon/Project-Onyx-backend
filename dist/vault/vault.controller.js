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
exports.VaultController = void 0;
const common_1 = require("@nestjs/common");
const vault_service_1 = require("./vault.service");
const auth_service_1 = require("../auth/auth.service");
let VaultController = class VaultController {
    constructor(vaultService, authService) {
        this.vaultService = vaultService;
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
    async addCredentials(authHeader, serviceName, username, password) {
        const userId = this.getAuthenticatedUserId(authHeader);
        if (!serviceName) {
            throw new common_1.BadRequestException('Le nom du service (ex: Netflix) est requis.');
        }
        if (!username) {
            throw new common_1.BadRequestException('L\'identifiant de connexion est requis.');
        }
        if (!password) {
            throw new common_1.BadRequestException('Le mot de passe de connexion est requis.');
        }
        return this.vaultService.addCredentials(userId, serviceName, username, password);
    }
    async getCredentials(authHeader) {
        const userId = this.getAuthenticatedUserId(authHeader);
        return this.vaultService.getCredentials(userId);
    }
    async deleteCredentials(authHeader, id) {
        const userId = this.getAuthenticatedUserId(authHeader);
        if (!id) {
            throw new common_1.BadRequestException('L\'identifiant de l\'entrée est requis.');
        }
        await this.vaultService.deleteCredentials(userId, id);
        return { success: true, message: 'Identifiant supprimé du coffre-fort avec succès.' };
    }
};
exports.VaultController = VaultController;
__decorate([
    (0, common_1.Post)('credentials'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)('serviceName')),
    __param(2, (0, common_1.Body)('username')),
    __param(3, (0, common_1.Body)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], VaultController.prototype, "addCredentials", null);
__decorate([
    (0, common_1.Get)('credentials'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VaultController.prototype, "getCredentials", null);
__decorate([
    (0, common_1.Delete)('credentials/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], VaultController.prototype, "deleteCredentials", null);
exports.VaultController = VaultController = __decorate([
    (0, common_1.Controller)('vault'),
    __metadata("design:paramtypes", [vault_service_1.VaultService,
        auth_service_1.AuthService])
], VaultController);
//# sourceMappingURL=vault.controller.js.map
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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("./wallet.service");
let WalletController = class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    async initiateRecharge(userId, amount) {
        if (!userId) {
            throw new common_1.BadRequestException('L\'en-tête x-user-id est obligatoire pour simuler l\'authentification.');
        }
        if (!amount || amount <= 0) {
            throw new common_1.BadRequestException('Le montant doit être supérieur à 0.');
        }
        return this.walletService.initiateRecharge(userId, amount);
    }
    async waveWebhook(referenceId, amount, status) {
        if (!referenceId || !status) {
            throw new common_1.BadRequestException('referenceId et status sont obligatoires dans le corps de la requête.');
        }
        return this.walletService.handleWaveWebhook(referenceId, amount, status);
    }
    async getHistory(userId) {
        if (!userId) {
            throw new common_1.BadRequestException('L\'en-tête x-user-id est obligatoire.');
        }
        return this.walletService.getTransactionHistory(userId);
    }
    async getWallet(userId) {
        if (!userId) {
            throw new common_1.BadRequestException('L\'en-tête x-user-id est obligatoire.');
        }
        return this.walletService.getWallet(userId);
    }
    async updateBudgetLimit(userId, limit) {
        if (!userId) {
            throw new common_1.BadRequestException('L\'en-tête x-user-id est obligatoire.');
        }
        if (limit === undefined || limit < 0) {
            throw new common_1.BadRequestException('Une limite valide est requise.');
        }
        return this.walletService.updateBudgetLimit(userId, limit);
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Post)('recharge'),
    __param(0, (0, common_1.Headers)('x-user-id')),
    __param(1, (0, common_1.Body)('amount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "initiateRecharge", null);
__decorate([
    (0, common_1.Post)('webhook/wave'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('referenceId')),
    __param(1, (0, common_1.Body)('amount')),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "waveWebhook", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Headers)('x-user-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('x-user-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Put)('budget-limit'),
    __param(0, (0, common_1.Headers)('x-user-id')),
    __param(1, (0, common_1.Body)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "updateBudgetLimit", null);
exports.WalletController = WalletController = __decorate([
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map
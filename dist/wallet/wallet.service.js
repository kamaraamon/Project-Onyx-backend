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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WalletService = class WalletService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async initiateRecharge(userId, amount) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur introuvable.');
        }
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId }
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Portefeuille introuvable.');
        }
        const feeRate = user.isPremium ? 0 : 0.01;
        const fee = amount * feeRate;
        const totalCharged = amount + fee;
        const referenceId = `WAVE_TX_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await this.prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                amount: amount,
                fee: fee,
                type: 'recharge',
                status: 'pending',
                referenceId: referenceId
            }
        });
        const paymentUrl = `https://checkout.wave.com/pay?ref=${referenceId}&amount=${totalCharged}&currency=XOF`;
        return {
            paymentUrl,
            referenceId,
            totalCharged,
            fee
        };
    }
    async handleWaveWebhook(referenceId, waveAmount, status) {
        const transaction = await this.prisma.walletTransaction.findUnique({
            where: { referenceId }
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction non trouvée.');
        }
        if (transaction.status !== 'pending') {
            throw new common_1.BadRequestException('Cette transaction a déjà été traitée.');
        }
        const updatedTransaction = await this.prisma.$transaction(async (tx) => {
            const updatedTx = await tx.walletTransaction.update({
                where: { id: transaction.id },
                data: { status }
            });
            if (status === 'completed') {
                await tx.wallet.update({
                    where: { id: transaction.walletId },
                    data: {
                        balance: {
                            increment: transaction.amount
                        }
                    }
                });
            }
            return updatedTx;
        });
        return updatedTransaction;
    }
    async getTransactionHistory(userId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId }
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Portefeuille introuvable.');
        }
        return this.prisma.walletTransaction.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: 'desc' }
        });
    }
    async updateBudgetLimit(userId, newLimit) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId }
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Portefeuille introuvable.');
        }
        if (newLimit < 0) {
            throw new common_1.BadRequestException('La limite budgétaire ne peut pas être négative.');
        }
        return this.prisma.wallet.update({
            where: { userId },
            data: { budgetLimit: newLimit }
        });
    }
    async getWallet(userId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId }
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Portefeuille introuvable.');
        }
        return wallet;
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map
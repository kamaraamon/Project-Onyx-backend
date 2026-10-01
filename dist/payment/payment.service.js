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
exports.PaymentService = exports.RenewalFundsException = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
class RenewalFundsException extends common_1.BadRequestException {
    constructor(message) {
        super(message);
        this.name = 'RenewalFundsException';
    }
}
exports.RenewalFundsException = RenewalFundsException;
let PaymentService = class PaymentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async deposit(userId, amount) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true }
        });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur introuvable.');
        }
        if (!user.wallet) {
            throw new common_1.NotFoundException('Portefeuille introuvable.');
        }
        const feeRate = user.isPremium ? 0.0 : 0.01;
        const fee = amount * feeRate;
        const netAmount = amount - fee;
        const result = await this.prisma.$transaction(async (tx) => {
            const updatedWallet = await tx.wallet.update({
                where: { userId },
                data: {
                    balance: {
                        increment: netAmount
                    }
                }
            });
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    amount: netAmount,
                    fee: fee,
                    type: client_1.TransactionType.DEPOSIT_WAVE
                }
            });
            return { wallet: updatedWallet, transaction };
        });
        return {
            message: 'Recharge reussie.',
            userId,
            originalAmount: amount,
            fee,
            netCredited: netAmount,
            newBalance: Number(result.wallet.balance),
            transactionId: result.transaction.id
        };
    }
    async checkRenewalFunds(subscriptionId) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                user: {
                    include: { wallet: true }
                }
            }
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Abonnement introuvable.');
        }
        const wallet = subscription.user.wallet;
        if (!wallet) {
            throw new common_1.NotFoundException('Portefeuille introuvable pour cet abonnement.');
        }
        const balanceNum = Number(wallet.balance);
        if (balanceNum < subscription.price) {
            throw new RenewalFundsException(`Fonds insuffisants pour renouveler l'abonnement ${subscription.name}. Requis: ${subscription.price} FCFA, Disponible: ${balanceNum} FCFA.`);
        }
        return true;
    }
    async handleWaveWebhook(payload, signature) {
        if (!signature) {
            throw new common_1.BadRequestException('Signature Webhook Wave manquante.');
        }
        const isValid = signature === 'valid_wave_signature_mock';
        if (!isValid) {
            throw new common_1.BadRequestException('Signature Webhook Wave invalide.');
        }
        const { userId, amount } = payload;
        if (!userId || !amount) {
            throw new common_1.BadRequestException('Payload Wave invalide.');
        }
        return this.deposit(userId, amount);
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map
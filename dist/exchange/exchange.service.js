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
exports.ExchangeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExchangeService = class ExchangeService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async proposeExchange(userId, userPhone, offeredSubName, wantedSubName) {
        const score = await this.getTrustScore(userId);
        if (score <= 30) {
            throw new common_1.BadRequestException('Votre score de confiance est trop bas pour proposer des échanges. Vous avez été suspendu de la bourse.');
        }
        if (!offeredSubName || !wantedSubName) {
            throw new common_1.BadRequestException('Le nom du service offert et celui du service recherché sont requis.');
        }
        let sub = await this.prisma.subscription.findFirst({
            where: { userId, name: offeredSubName }
        });
        if (!sub) {
            sub = await this.prisma.subscription.create({
                data: {
                    userId,
                    name: offeredSubName,
                    price: 5000,
                    nextBillingDate: new Date(Date.now() + 30 * 24 * 3600 * 1000)
                }
            });
        }
        const proposal = await this.prisma.exchange.create({
            data: {
                offeringUserId: userId,
                offeredSubscriptionId: sub.id,
                wantedSubName,
                status: 'available'
            },
            include: {
                offeredSubscription: true,
                offeringUser: true
            }
        });
        return {
            id: proposal.id,
            offeringUserId: proposal.offeringUserId,
            offeringUserPhone: proposal.offeringUser.phone.split(' ')[0],
            offeredSubName: proposal.offeredSubscription.name,
            wantedSubName: proposal.wantedSubName,
            status: proposal.status,
            createdAt: proposal.createdAt
        };
    }
    async getListings() {
        const activeExchanges = await this.prisma.exchange.findMany({
            where: { status: 'available' },
            include: {
                offeredSubscription: true,
                offeringUser: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return activeExchanges.map(ex => ({
            id: ex.id,
            offeringUserId: ex.offeringUserId,
            offeringUserPhone: ex.offeringUser.phone.split(' ')[0],
            offeredSubName: ex.offeredSubscription.name,
            wantedSubName: ex.wantedSubName,
            status: ex.status,
            createdAt: 'À l\'instant'
        }));
    }
    async acceptExchange(userId, exchangeId) {
        const proposal = await this.prisma.exchange.findUnique({
            where: { id: exchangeId }
        });
        if (!proposal) {
            throw new common_1.NotFoundException('La proposition d\'échange est introuvable.');
        }
        if (proposal.status !== 'available') {
            throw new common_1.BadRequestException('Cet échange n\'est plus disponible.');
        }
        if (proposal.offeringUserId === userId) {
            throw new common_1.BadRequestException('Vous ne pouvez pas accepter votre propre proposition d\'échange.');
        }
        return this.prisma.exchange.update({
            where: { id: exchangeId },
            data: { status: 'completed' }
        });
    }
    async reportUser(targetUserId, reason) {
        const user = await this.prisma.user.findUnique({
            where: { id: targetUserId }
        });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur cible introuvable.');
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: targetUserId },
            data: {
                trustScore: {
                    decrement: 20
                }
            }
        });
        return {
            targetUserId,
            newScore: updatedUser.trustScore
        };
    }
    async getTrustScore(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        return user ? user.trustScore : 100;
    }
    async claimBackupProfile(userId, exchangeId) {
        return this.prisma.securityAlert.create({
            data: {
                userId,
                title: 'Sécurité : Profil de Secours Réclamé',
                message: `Signalement d'incident d'accès sur l'échange ${exchangeId}. Un profil temporaire de secours a été émis.`,
                channel: 'both'
            }
        });
    }
    async getBackupClaims(userId) {
        return this.prisma.securityAlert.findMany({
            where: {
                userId,
                title: 'Sécurité : Profil de Secours Réclamé'
            }
        });
    }
};
exports.ExchangeService = ExchangeService;
exports.ExchangeService = ExchangeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExchangeService);
//# sourceMappingURL=exchange.service.js.map
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
exports.ConciergeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ConciergeService = class ConciergeService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRequest(userId, actionType, serviceName) {
        if (!actionType || !serviceName) {
            throw new common_1.BadRequestException('Le type d\'action et le nom du service sont requis.');
        }
        const slaExpiry = new Date();
        slaExpiry.setHours(slaExpiry.getHours() + 24);
        const newRequest = await this.prisma.conciergeRequest.create({
            data: {
                userId,
                actionType,
                serviceName,
                status: 'pending',
                slaExpiry
            }
        });
        await this.prisma.securityAlert.create({
            data: {
                userId,
                title: 'Demande reçue',
                message: `Votre demande de ${actionType} pour le service ${serviceName} a été enregistrée (Traitement garanti sous 24h).`,
                channel: 'both'
            }
        });
        return newRequest;
    }
    async getRequests(userId) {
        const list = await this.prisma.conciergeRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        return list.map(req => {
            const diffMs = req.slaExpiry.getTime() - Date.now();
            const slaHoursRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
            return {
                id: req.id,
                userId: req.userId,
                actionType: req.actionType,
                serviceName: req.serviceName,
                status: req.status === 'completed' ? 'Terminé' : 'En cours',
                slaHoursRemaining
            };
        });
    }
    async completeRequest(requestId) {
        const request = await this.prisma.conciergeRequest.findUnique({
            where: { id: requestId }
        });
        if (!request) {
            throw new common_1.NotFoundException('Demande introuvable.');
        }
        if (request.status === 'completed') {
            throw new common_1.BadRequestException('Cette demande a déjà été complétée.');
        }
        const updatedRequest = await this.prisma.conciergeRequest.update({
            where: { id: requestId },
            data: { status: 'completed' }
        });
        console.log(`[PUSH NOTIFICATION DISPATCHED] User ID: ${request.userId} | Titre: Action Terminée | Message: L'administrateur Onyx a finalisé la demande de ${request.actionType} sur votre compte ${request.serviceName}.`);
        console.log(`[EMAIL NOTIFICATION DISPATCHED] User ID: ${request.userId} | Titre: Résumé d'action officielle Onyx | Message: Votre sécurité est notre priorité. Une action de ${request.actionType} a été menée avec succès.`);
        await this.prisma.securityAlert.create({
            data: {
                userId: request.userId,
                title: 'Sécurité : Action Exécutée',
                message: `L'action de ${request.actionType} sur ${request.serviceName} a été exécutée par la conciergerie. Double alerte émise.`,
                channel: 'both'
            }
        });
        return updatedRequest;
    }
    async getAlerts(userId) {
        const list = await this.prisma.securityAlert.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        return list.map(a => {
            const diffMs = Date.now() - a.createdAt.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const timeStr = diffHours === 0 ? 'À l\'instant' : `Il y a ${diffHours} heures`;
            return {
                id: a.id,
                title: a.title,
                message: a.message,
                time: timeStr
            };
        });
    }
};
exports.ConciergeService = ConciergeService;
exports.ConciergeService = ConciergeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConciergeService);
//# sourceMappingURL=concierge.service.js.map
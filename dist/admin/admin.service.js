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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const encryption_service_1 = require("../common/services/encryption.service");
let AdminService = class AdminService {
    constructor(prisma, encryptionService) {
        this.prisma = prisma;
        this.encryptionService = encryptionService;
    }
    async getTasks() {
        return this.prisma.conciergeRequest.findMany({
            where: { status: 'pending' },
            orderBy: { createdAt: 'asc' }
        });
    }
    async decryptCredentials(coffreFortId) {
        const entry = await this.prisma.coffreFort.findUnique({
            where: { id: coffreFortId }
        });
        if (!entry) {
            throw new common_1.NotFoundException('Identifiant de coffre-fort introuvable.');
        }
        const [userIv, passIv] = entry.iv.split(':');
        const [userTag, passTag] = entry.tag ? entry.tag.split(':') : ['', ''];
        if (!userIv || !passIv) {
            throw new common_1.BadRequestException('Vecteurs d\'initialisation invalides ou corrompus.');
        }
        try {
            const username = this.encryptionService.decrypt(entry.encryptedUsername, userIv, userTag);
            const password = this.encryptionService.decrypt(entry.encryptedPassword, passIv, passTag);
            console.warn(`[AUDIT ADMIN] Dechiffrement de securite effectue sur le coffre-fort ID ${coffreFortId} pour le service ${entry.serviceName}.`);
            return {
                id: entry.id,
                serviceName: entry.serviceName,
                username,
                password,
                decryptedAt: new Date()
            };
        }
        catch (err) {
            throw new common_1.BadRequestException(`Erreur de dechiffrement : ${err.message}`);
        }
    }
    async resolveLitigation(litigationId) {
        const litigation = await this.prisma.litigation.findUnique({
            where: { id: litigationId }
        });
        if (!litigation) {
            throw new common_1.NotFoundException('Litige introuvable.');
        }
        if (litigation.status !== 'PENDING') {
            throw new common_1.BadRequestException('Ce litige a deja ete traite.');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const updatedOffender = await tx.user.update({
                where: { id: litigation.offenderId },
                data: {
                    trustScore: {
                        decrement: 30
                    }
                }
            });
            const backupProfileId = `BACKUP_PROFILE_ONYX_${Math.floor(1000 + Math.random() * 9000)}`;
            const updatedLitigation = await tx.litigation.update({
                where: { id: litigationId },
                data: {
                    status: 'RESOLVED',
                    backupProfileId: backupProfileId
                }
            });
            await tx.securityAlert.create({
                data: {
                    userId: litigation.reporterId,
                    title: 'Litige Resolu : Profil de Secours Attribue',
                    message: `Votre litige #${litigationId} a ete resolu. Le profil de secours ${backupProfileId} vous a ete attribue sous SLA 24h.`,
                    channel: 'both'
                }
            });
            return { updatedOffender, updatedLitigation };
        });
        return {
            message: 'Litige resolu avec succes.',
            litigationId,
            offenderId: litigation.offenderId,
            newOffenderTrustScore: result.updatedOffender.trustScore,
            backupProfileId: result.updatedLitigation.backupProfileId,
            status: result.updatedLitigation.status
        };
    }
    async createMockDataForTesting() {
        const userReporter = await this.prisma.user.findFirst();
        const userOffender = await this.prisma.user.findFirst({
            where: {
                id: { not: userReporter?.id }
            }
        });
        if (!userReporter || !userOffender) {
            throw new common_1.BadRequestException('Il faut au moins deux utilisateurs enregistres en base pour generer des donnees de test.');
        }
        const mockRequest = await this.prisma.conciergeRequest.create({
            data: {
                userId: userReporter.id,
                actionType: 'swapping',
                serviceName: 'Netflix Premium',
                slaExpiry: new Date(Date.now() + 24 * 3600 * 1000)
            }
        });
        const mockLitigation = await this.prisma.litigation.create({
            data: {
                reporterId: userReporter.id,
                offenderId: userOffender.id,
                trustScoreImpact: 30,
                status: 'PENDING'
            }
        });
        return {
            message: 'Donnees de test creees avec succes.',
            mockTaskId: mockRequest.id,
            mockLitigationId: mockLitigation.id
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService])
], AdminService);
//# sourceMappingURL=admin.service.js.map
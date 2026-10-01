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
exports.VaultService = void 0;
const common_1 = require("@nestjs/common");
const crypto_service_1 = require("../common/services/crypto.service");
const prisma_service_1 = require("../prisma/prisma.service");
let VaultService = class VaultService {
    constructor(prisma, cryptoService) {
        this.prisma = prisma;
        this.cryptoService = cryptoService;
    }
    async addCredentials(userId, serviceName, username, password) {
        const encryptedUserResult = this.cryptoService.encrypt(username);
        const encryptedPassResult = this.cryptoService.encrypt(password);
        const newEntry = await this.prisma.coffreFort.create({
            data: {
                userId,
                serviceName,
                encryptedUsername: encryptedUserResult.encryptedText,
                encryptedPassword: encryptedPassResult.encryptedText,
                iv: `${encryptedUserResult.iv}:${encryptedPassResult.iv}`,
                tag: `${encryptedUserResult.tag}:${encryptedPassResult.tag}`
            }
        });
        return {
            id: newEntry.id,
            serviceName: newEntry.serviceName,
            createdAt: newEntry.createdAt
        };
    }
    async getCredentials(userId) {
        const userEntries = await this.prisma.coffreFort.findMany({
            where: { userId }
        });
        return userEntries.map(entry => {
            const [userIv, passIv] = entry.iv.split(':');
            const [userTag, passTag] = entry.tag ? entry.tag.split(':') : ['', ''];
            try {
                const decryptedUsername = this.cryptoService.decrypt(entry.encryptedUsername, userIv, userTag);
                const decryptedPassword = this.cryptoService.decrypt(entry.encryptedPassword, passIv, passTag);
                return {
                    id: entry.id,
                    serviceName: entry.serviceName,
                    username: decryptedUsername,
                    password: decryptedPassword,
                    createdAt: entry.createdAt
                };
            }
            catch (err) {
                return {
                    id: entry.id,
                    serviceName: entry.serviceName,
                    username: '[Erreur de déchiffrement]',
                    password: '[Erreur de déchiffrement]',
                    createdAt: entry.createdAt
                };
            }
        });
    }
    async deleteCredentials(userId, entryId) {
        const entry = await this.prisma.coffreFort.findUnique({
            where: { id: entryId }
        });
        if (!entry || entry.userId !== userId) {
            throw new common_1.NotFoundException('Identifiant de coffre-fort introuvable.');
        }
        await this.prisma.coffreFort.delete({
            where: { id: entryId }
        });
    }
};
exports.VaultService = VaultService;
exports.VaultService = VaultService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crypto_service_1.CryptoService])
], VaultService);
//# sourceMappingURL=vault.service.js.map
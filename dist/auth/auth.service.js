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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async register(phone, password) {
        const existingUser = await this.prisma.user.findUnique({
            where: { phone }
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Un compte existe déjà avec ce numéro de téléphone.');
        }
        if (password.length < 6) {
            throw new common_1.BadRequestException('Le mot de passe doit contenir au moins 6 caractères.');
        }
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        const passwordHash = `${salt}:${hash}`;
        const newUser = await this.prisma.user.create({
            data: {
                phone,
                passwordHash,
                wallet: {
                    create: {
                        balance: 0.00,
                        budgetLimit: 25000.00
                    }
                }
            }
        });
        return {
            id: newUser.id,
            phone: newUser.phone,
            isPremium: newUser.isPremium
        };
    }
    async login(phone, password) {
        const user = await this.prisma.user.findUnique({
            where: { phone }
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Identifiants incorrects.');
        }
        const [salt, storedHash] = user.passwordHash.split(':');
        const computedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        if (computedHash !== storedHash) {
            throw new common_1.UnauthorizedException('Identifiants incorrects.');
        }
        const payload = {
            userId: user.id,
            phone: user.phone,
            isPremium: user.isPremium,
            exp: Math.floor(Date.now() / 1000) + 86400
        };
        const header = { alg: 'HS256', typ: 'JWT' };
        const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signature = crypto
            .createHmac('sha256', 'onyx-jwt-secret-key-super-secure')
            .update(`${base64Header}.${base64Payload}`)
            .digest('base64url');
        const accessToken = `${base64Header}.${base64Payload}.${signature}`;
        return {
            accessToken,
            user: {
                id: user.id,
                phone: user.phone,
                isPremium: user.isPremium
            }
        };
    }
    async changePassword(userId, oldPass, newPass) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new common_1.BadRequestException('Utilisateur introuvable.');
        }
        const [salt, storedHash] = user.passwordHash.split(':');
        const computedHash = crypto.pbkdf2Sync(oldPass, salt, 1000, 64, 'sha512').toString('hex');
        if (computedHash !== storedHash) {
            throw new common_1.BadRequestException('L\'ancien mot de passe est incorrect.');
        }
        if (newPass.length < 6) {
            throw new common_1.BadRequestException('Le nouveau mot de passe doit contenir au moins 6 caractères.');
        }
        const newSalt = crypto.randomBytes(16).toString('hex');
        const newHash = crypto.pbkdf2Sync(newPass, newSalt, 1000, 64, 'sha512').toString('hex');
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: `${newSalt}:${newHash}` }
        });
    }
    validateToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new common_1.UnauthorizedException('Jeton invalide.');
            }
            const [header, payload, signature] = parts;
            const expectedSignature = crypto
                .createHmac('sha256', 'onyx-jwt-secret-key-super-secure')
                .update(`${header}.${payload}`)
                .digest('base64url');
            if (signature !== expectedSignature) {
                throw new common_1.UnauthorizedException('Signature du jeton invalide.');
            }
            const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
            if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
                throw new common_1.UnauthorizedException('Le jeton a expiré.');
            }
            return {
                userId: decodedPayload.userId,
                phone: decodedPayload.phone,
                isPremium: decodedPayload.isPremium
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Authentification échouée.');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
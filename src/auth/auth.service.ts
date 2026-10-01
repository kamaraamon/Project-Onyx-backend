import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enregistre un nouvel utilisateur (numéro Wave) et lui associe un portefeuille vide
   */
  async register(phone: string, password: string): Promise<{ id: string; phone: string; isPremium: boolean }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { phone }
    });

    if (existingUser) {
      throw new BadRequestException('Un compte existe déjà avec ce numéro de téléphone.');
    }

    if (password.length < 6) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 6 caractères.');
    }

    // Hachage du mot de passe
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    const passwordHash = `${salt}:${hash}`;

    // Insertion transactionnelle : Utilisateur + Portefeuille vide associé
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

  /**
   * Connecte l'utilisateur en validant le numéro et le mot de passe
   */
  async login(phone: string, password: string): Promise<{ accessToken: string; user: { id: string; phone: string; isPremium: boolean } }> {
    const user = await this.prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects.');
    }

    const [salt, storedHash] = user.passwordHash.split(':');
    const computedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    if (computedHash !== storedHash) {
      throw new UnauthorizedException('Identifiants incorrects.');
    }

    // Génération du JWT simulé
    const payload = {
      userId: user.id,
      phone: user.phone,
      isPremium: user.isPremium,
      exp: Math.floor(Date.now() / 1000) + 86400 // Expire dans 24 heures
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

  /**
   * Change le mot de passe après vérification de l'ancien
   */
  async changePassword(userId: string, oldPass: string, newPass: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new BadRequestException('Utilisateur introuvable.');
    }

    const [salt, storedHash] = user.passwordHash.split(':');
    const computedHash = crypto.pbkdf2Sync(oldPass, salt, 1000, 64, 'sha512').toString('hex');

    if (computedHash !== storedHash) {
      throw new BadRequestException('L\'ancien mot de passe est incorrect.');
    }

    if (newPass.length < 6) {
      throw new BadRequestException('Le nouveau mot de passe doit contenir au moins 6 caractères.');
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = crypto.pbkdf2Sync(newPass, newSalt, 1000, 64, 'sha512').toString('hex');
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: `${newSalt}:${newHash}` }
    });
  }

  /**
   * Décode et valide le JWT token simulé
   */
  validateToken(token: string): { userId: string; phone: string; isPremium: boolean } {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new UnauthorizedException('Jeton invalide.');
      }

      const [header, payload, signature] = parts;
      const expectedSignature = crypto
        .createHmac('sha256', 'onyx-jwt-secret-key-super-secure')
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        throw new UnauthorizedException('Signature du jeton invalide.');
      }

      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('Le jeton a expiré.');
      }

      return {
        userId: decodedPayload.userId,
        phone: decodedPayload.phone,
        isPremium: decodedPayload.isPremium
      };
    } catch (error) {
      throw new UnauthorizedException('Authentification échouée.');
    }
  }
}

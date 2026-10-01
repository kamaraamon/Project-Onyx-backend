import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService
  ) {}

  /**
   * Recupere la file d'attente des taches de conciergerie (SLA 24h)
   */
  async getTasks(): Promise<any[]> {
    return this.prisma.conciergeRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' } // Tri chronologique (le plus ancien en premier)
    });
  }

  /**
   * Dechiffre les identifiants d'un coffre-fort de maniere tracee
   */
  async decryptCredentials(coffreFortId: string): Promise<any> {
    const entry = await this.prisma.coffreFort.findUnique({
      where: { id: coffreFortId }
    });

    if (!entry) {
      throw new NotFoundException('Identifiant de coffre-fort introuvable.');
    }

    const [userIv, passIv] = entry.iv.split(':');
    const [userTag, passTag] = entry.tag ? entry.tag.split(':') : ['', ''];

    if (!userIv || !passIv) {
      throw new BadRequestException('Vecteurs d\'initialisation invalides ou corrompus.');
    }

    try {
      const username = this.encryptionService.decrypt(
        entry.encryptedUsername,
        userIv,
        userTag
      );
      const password = this.encryptionService.decrypt(
        entry.encryptedPassword,
        passIv,
        passTag
      );

      console.warn(`[AUDIT ADMIN] Dechiffrement de securite effectue sur le coffre-fort ID ${coffreFortId} pour le service ${entry.serviceName}.`);

      return {
        id: entry.id,
        serviceName: entry.serviceName,
        username,
        password,
        decryptedAt: new Date()
      };
    } catch (err: any) {
      throw new BadRequestException(`Erreur de dechiffrement : ${err.message}`);
    }
  }

  /**
   * Valide et resout un litige d'echange
   */
  async resolveLitigation(litigationId: string): Promise<any> {
    const litigation = await this.prisma.litigation.findUnique({
      where: { id: litigationId }
    });

    if (!litigation) {
      throw new NotFoundException('Litige introuvable.');
    }

    if (litigation.status !== 'PENDING') {
      throw new BadRequestException('Ce litige a deja ete traite.');
    }

    // Resolution dans une transaction Prisma
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Appliquer le malus de -30 points de confiance au fautif
      const updatedOffender = await tx.user.update({
        where: { id: litigation.offenderId },
        data: {
          trustScore: {
            decrement: 30
          }
        }
      });

      // 2. Enregistrer l'attribution du profil de secours temporaire
      const backupProfileId = `BACKUP_PROFILE_ONYX_${Math.floor(1000 + Math.random() * 9000)}`;
      const updatedLitigation = await tx.litigation.update({
        where: { id: litigationId },
        data: {
          status: 'RESOLVED',
          backupProfileId: backupProfileId
        }
      });

      // 3. Logger une alerte de securite pour la victime
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

  /**
   * Helper pour creer des donnees de test (DX / verification manuelle)
   */
  async createMockDataForTesting(): Promise<any> {
    // A utiliser pour generer des entrees factices a des fins de test
    const userReporter = await this.prisma.user.findFirst();
    const userOffender = await this.prisma.user.findFirst({
      where: {
        id: { not: userReporter?.id }
      }
    });

    if (!userReporter || !userOffender) {
      throw new BadRequestException('Il faut au moins deux utilisateurs enregistres en base pour generer des donnees de test.');
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
}

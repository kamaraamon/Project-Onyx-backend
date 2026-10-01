import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExchangeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée une proposition d'échange sur la bourse
   */
  async proposeExchange(
    userId: string,
    userPhone: string,
    offeredSubName: string,
    wantedSubName: string
  ): Promise<any> {
    
    // Vérification du score de confiance de l'utilisateur en BDD
    const score = await this.getTrustScore(userId);
    if (score <= 30) {
      throw new BadRequestException('Votre score de confiance est trop bas pour proposer des échanges. Vous avez été suspendu de la bourse.');
    }

    if (!offeredSubName || !wantedSubName) {
      throw new BadRequestException('Le nom du service offert et celui du service recherché sont requis.');
    }

    // Récupère ou crée un abonnement factice pour satisfaire la contrainte de clé étrangère
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

    // Création de l'échange
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

  /**
   * Récupère la liste de toutes les propositions d'échanges actives
   */
  async getListings(): Promise<any[]> {
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

  /**
   * Accepte un échange existant
   */
  async acceptExchange(userId: string, exchangeId: string): Promise<any> {
    const proposal = await this.prisma.exchange.findUnique({
      where: { id: exchangeId }
    });

    if (!proposal) {
      throw new NotFoundException('La proposition d\'échange est introuvable.');
    }

    if (proposal.status !== 'available') {
      throw new BadRequestException('Cet échange n\'est plus disponible.');
    }

    if (proposal.offeringUserId === userId) {
      throw new BadRequestException('Vous ne pouvez pas accepter votre propre proposition d\'échange.');
    }

    return this.prisma.exchange.update({
      where: { id: exchangeId },
      data: { status: 'completed' }
    });
  }

  /**
   * Signale un comportement frauduleux (baisse de score de confiance de 20 points)
   */
  async reportUser(targetUserId: string, reason: string): Promise<{ targetUserId: string; newScore: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId }
    });
    if (!user) {
      throw new NotFoundException('Utilisateur cible introuvable.');
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

  /**
   * Récupère le score de confiance d'un utilisateur
   */
  async getTrustScore(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    return user ? user.trustScore : 100;
  }

  /**
   * Réclame un profil de secours (Garantie Onyx sous 24h)
   * Loggé sous forme d'une alerte de sécurité critique de niveau ticket
   */
  async claimBackupProfile(userId: string, exchangeId: string): Promise<any> {
    return this.prisma.securityAlert.create({
      data: {
        userId,
        title: 'Sécurité : Profil de Secours Réclamé',
        message: `Signalement d'incident d'accès sur l'échange ${exchangeId}. Un profil temporaire de secours a été émis.`,
        channel: 'both'
      }
    });
  }

  /**
   * Récupère les demandes de profil de secours
   */
  async getBackupClaims(userId: string): Promise<any[]> {
    return this.prisma.securityAlert.findMany({
      where: {
        userId,
        title: 'Sécurité : Profil de Secours Réclamé'
      }
    });
  }
}

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConciergeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Soumet une nouvelle demande d'action de gestion à la conciergerie (début de la SLA 24h)
   */
  async createRequest(
    userId: string,
    actionType: 'activation' | 'suspension' | 'resiliation' | 'swapping',
    serviceName: string
  ): Promise<any> {
    if (!actionType || !serviceName) {
      throw new BadRequestException('Le type d\'action et le nom du service sont requis.');
    }

    const slaExpiry = new Date();
    slaExpiry.setHours(slaExpiry.getHours() + 24); // SLA Garantie de 24 heures

    // Enregistrement de la demande en BDD
    const newRequest = await this.prisma.conciergeRequest.create({
      data: {
        userId,
        actionType,
        serviceName,
        status: 'pending',
        slaExpiry
      }
    });

    // Enregistrement d'une alerte de sécurité immédiate
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

  /**
   * Récupère la liste des requêtes de l'utilisateur
   */
  async getRequests(userId: string): Promise<any[]> {
    const list = await this.prisma.conciergeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Calcule dynamiquement le temps restant en heures
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

  /**
   * Clôture une demande (Action effectuée par un administrateur Onyx)
   * Déclenche la DOUBLE NOTIFICATION de Sécurité (Email + Push)
   */
  async completeRequest(requestId: string): Promise<any> {
    const request = await this.prisma.conciergeRequest.findUnique({
      where: { id: requestId }
    });
    if (!request) {
      throw new NotFoundException('Demande introuvable.');
    }

    if (request.status === 'completed') {
      throw new BadRequestException('Cette demande a déjà été complétée.');
    }

    // Mise à jour de la demande en BDD
    const updatedRequest = await this.prisma.conciergeRequest.update({
      where: { id: requestId },
      data: { status: 'completed' }
    });

    // DOUBLE NOTIFICATION DE SÉCURITÉ
    console.log(`[PUSH NOTIFICATION DISPATCHED] User ID: ${request.userId} | Titre: Action Terminée | Message: L'administrateur Onyx a finalisé la demande de ${request.actionType} sur votre compte ${request.serviceName}.`);
    console.log(`[EMAIL NOTIFICATION DISPATCHED] User ID: ${request.userId} | Titre: Résumé d'action officielle Onyx | Message: Votre sécurité est notre priorité. Une action de ${request.actionType} a été menée avec succès.`);

    // Enregistrement dans le journal de sécurité
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

  /**
   * Récupère le journal d'alertes sécurité d'un utilisateur
   */
  async getAlerts(userId: string): Promise<any[]> {
    const list = await this.prisma.securityAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return list.map(a => {
      // Formate le temps écoulé de manière lisible
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
}

import { Controller, Post, Get, Body, Headers, Param, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConciergeService } from './concierge.service';
import { ConciergeRequest, SecurityAlert } from '@prisma/client';
import { AuthService } from '../auth/auth.service';

@Controller('concierge')
export class ConciergeController {
  constructor(
    private readonly conciergeService: ConciergeService,
    private readonly authService: AuthService
  ) {}

  /**
   * Helper pour valider le JWT et retourner l'userId
   */
  private getAuthenticatedUserId(authHeader?: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Jeton d\'authentification manquant ou invalide.');
    }
    const token = authHeader.split(' ')[1];
    const userPayload = this.authService.validateToken(token);
    return userPayload.userId;
  }

  /**
   * Soumet une nouvelle demande d'action de gestion à la conciergerie
   * POST /concierge/request
   */
  @Post('request')
  async createRequest(
    @Headers('authorization') authHeader: string,
    @Body('actionType') actionType: 'activation' | 'suspension' | 'resiliation' | 'swapping',
    @Body('serviceName') serviceName: string
  ): Promise<ConciergeRequest> {
    const userId = this.getAuthenticatedUserId(authHeader);

    if (!actionType) {
      throw new BadRequestException('Le type d\'action est obligatoire (activation, suspension, resiliation).');
    }
    if (!serviceName) {
      throw new BadRequestException('Le nom du service cible est obligatoire.');
    }

    return this.conciergeService.createRequest(userId, actionType, serviceName);
  }

  /**
   * Récupère la liste des demandes de gestion de l'utilisateur connecté
   * GET /concierge/requests
   */
  @Get('requests')
  async getRequests(@Headers('authorization') authHeader: string): Promise<ConciergeRequest[]> {
    const userId = this.getAuthenticatedUserId(authHeader);
    return this.conciergeService.getRequests(userId);
  }

  /**
   * Clôture une demande (simulé par un administrateur) et émet la double alerte de sécurité
   * POST /concierge/admin/complete/:id
   */
  @Post('admin/complete/:id')
  async completeRequest(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string
  ): Promise<ConciergeRequest> {
    this.getAuthenticatedUserId(authHeader); // Valide que la requête provient d'un compte connecté
    if (!id) {
      throw new BadRequestException('L\'identifiant de la demande est requis.');
    }
    return this.conciergeService.completeRequest(id);
  }

  /**
   * Récupère le journal d'alertes sécurité de l'utilisateur connecté
   * GET /concierge/alerts
   */
  @Get('alerts')
  async getAlerts(@Headers('authorization') authHeader: string): Promise<SecurityAlert[]> {
    const userId = this.getAuthenticatedUserId(authHeader);
    return this.conciergeService.getAlerts(userId);
  }
}

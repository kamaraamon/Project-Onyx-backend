import { Controller, Post, Get, Body, Headers, Param, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { Exchange } from '@prisma/client';
import { AuthService } from '../auth/auth.service';

@Controller('exchange')
export class ExchangeController {
  constructor(
    private readonly exchangeService: ExchangeService,
    private readonly authService: AuthService
  ) {}

  /**
   * Helper pour extraire l'utilisateur connecté via JWT
   */
  private getAuthenticatedUser(authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Jeton d\'authentification manquant ou invalide.');
    }
    const token = authHeader.split(' ')[1];
    return this.authService.validateToken(token);
  }

  /**
   * Propose un échange d'abonnements sur la bourse
   * POST /exchange/propose
   */
  @Post('propose')
  async proposeExchange(
    @Headers('authorization') authHeader: string,
    @Body('offeredSubName') offeredSubName: string,
    @Body('wantedSubName') wantedSubName: string
  ): Promise<Exchange> {
    const user = this.getAuthenticatedUser(authHeader);

    if (!offeredSubName) {
      throw new BadRequestException('Le nom du service proposé est obligatoire.');
    }
    if (!wantedSubName) {
      throw new BadRequestException('Le nom du service recherché est obligatoire.');
    }

    return this.exchangeService.proposeExchange(
      user.userId,
      user.phone,
      offeredSubName,
      wantedSubName
    );
  }

  /**
   * Récupère la liste des propositions d'échanges disponibles
   * GET /exchange/listings
   */
  @Get('listings')
  async getListings(): Promise<Exchange[]> {
    return this.exchangeService.getListings();
  }

  /**
   * Accepte un échange proposé
   * POST /exchange/accept/:id
   */
  @Post('accept/:id')
  async acceptExchange(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string
  ): Promise<Exchange> {
    const user = this.getAuthenticatedUser(authHeader);
    if (!id) {
      throw new BadRequestException('L\'identifiant de la proposition d\'échange est requis.');
    }
    return this.exchangeService.acceptExchange(user.userId, id);
  }

  /**
   * Récupère le score de confiance actuel de l'utilisateur connecté
   * GET /exchange/trust-score
   */
  @Get('trust-score')
  async getTrustScore(@Headers('authorization') authHeader: string): Promise<{ trustScore: number }> {
    const user = this.getAuthenticatedUser(authHeader);
    const score = await this.exchangeService.getTrustScore(user.userId);
    return { trustScore: score };
  }

  /**
   * Signale un comportement frauduleux (réduction du score de confiance)
   * POST /exchange/report
   */
  @Post('report')
  async reportUser(
    @Headers('authorization') authHeader: string,
    @Body('targetUserId') targetUserId: string,
    @Body('reason') reason: string
  ) {
    this.getAuthenticatedUser(authHeader); // Valide l'auth du rapporteur

    if (!targetUserId) {
      throw new BadRequestException('L\'identifiant de l\'utilisateur à signaler est obligatoire.');
    }
    if (!reason) {
      throw new BadRequestException('La raison du signalement est obligatoire.');
    }

    return this.exchangeService.reportUser(targetUserId, reason);
  }

  /**
   * Réclame un profil de secours (SLA Garantie Onyx)
   * POST /exchange/claim-backup
   */
  @Post('claim-backup')
  async claimBackup(
    @Headers('authorization') authHeader: string,
    @Body('exchangeId') exchangeId: string
  ): Promise<any> {
    const user = this.getAuthenticatedUser(authHeader);

    if (!exchangeId) {
      throw new BadRequestException('L\'identifiant de l\'échange concerné est requis.');
    }

    return this.exchangeService.claimBackupProfile(user.userId, exchangeId);
  }
}

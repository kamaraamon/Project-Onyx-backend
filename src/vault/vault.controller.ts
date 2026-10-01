import { Controller, Post, Get, Delete, Body, Headers, Param, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { VaultService } from './vault.service';
import { AuthService } from '../auth/auth.service';

@Controller('vault')
export class VaultController {
  constructor(
    private readonly vaultService: VaultService,
    private readonly authService: AuthService
  ) {}

  /**
   * Helper pour valider l'en-tête Authorization Bearer JWT et retourner l'userId
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
   * Enregistre un identifiant chiffré dans le coffre-fort
   * POST /vault/credentials
   */
  @Post('credentials')
  async addCredentials(
    @Headers('authorization') authHeader: string,
    @Body('serviceName') serviceName: string,
    @Body('username') username: string,
    @Body('password') password?: string
  ) {
    const userId = this.getAuthenticatedUserId(authHeader);

    if (!serviceName) {
      throw new BadRequestException('Le nom du service (ex: Netflix) est requis.');
    }
    if (!username) {
      throw new BadRequestException('L\'identifiant de connexion est requis.');
    }
    if (!password) {
      throw new BadRequestException('Le mot de passe de connexion est requis.');
    }

    return this.vaultService.addCredentials(userId, serviceName, username, password);
  }

  /**
   * Récupère et déchiffre la liste des accès de l'utilisateur
   * GET /vault/credentials
   */
  @Get('credentials')
  async getCredentials(@Headers('authorization') authHeader: string) {
    const userId = this.getAuthenticatedUserId(authHeader);
    return this.vaultService.getCredentials(userId);
  }

  /**
   * Supprime un identifiant du coffre-fort
   * DELETE /vault/credentials/:id
   */
  @Delete('credentials/:id')
  async deleteCredentials(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string
  ) {
    const userId = this.getAuthenticatedUserId(authHeader);
    if (!id) {
      throw new BadRequestException('L\'identifiant de l\'entrée est requis.');
    }
    await this.vaultService.deleteCredentials(userId, id);
    return { success: true, message: 'Identifiant supprimé du coffre-fort avec succès.' };
  }
}

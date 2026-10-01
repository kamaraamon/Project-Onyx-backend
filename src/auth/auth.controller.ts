import { Controller, Post, Get, Put, Body, Headers, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Inscription d'un nouvel utilisateur (téléphone Wave + mot de passe)
   * POST /auth/register
   */
  @Post('register')
  async register(
    @Body('phone') phone: string,
    @Body('password') password?: string
  ) {
    if (!phone) {
      throw new BadRequestException('Le numéro de téléphone Wave est requis.');
    }
    if (!password) {
      throw new BadRequestException('Le mot de passe est requis.');
    }
    return this.authService.register(phone, password);
  }

  /**
   * Connexion utilisateur
   * POST /auth/login
   */
  @Post('login')
  async login(
    @Body('phone') phone: string,
    @Body('password') password?: string
  ) {
    if (!phone) {
      throw new BadRequestException('Le numéro de téléphone Wave est requis.');
    }
    if (!password) {
      throw new BadRequestException('Le mot de passe est requis.');
    }
    return this.authService.login(phone, password);
  }

  /**
   * Récupère le profil de l'utilisateur connecté via son jeton JWT
   * GET /auth/me
   */
  @Get('me')
  async getProfile(@Headers('authorization') authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('En-tête Authorization manquant ou mal formaté.');
    }

    const token = authHeader.split(' ')[1];
    return this.authService.validateToken(token);
  }

  /**
   * Modifie le mot de passe utilisateur
   * PUT /auth/change-password
   */
  @Put('change-password')
  async changePassword(
    @Headers('authorization') authHeader: string,
    @Body('oldPassword') oldPass: string,
    @Body('newPassword') newPass: string
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Jeton d\'authentification manquant ou invalide.');
    }
    const token = authHeader.split(' ')[1];
    const userPayload = this.authService.validateToken(token);

    if (!oldPass || !newPass) {
      throw new BadRequestException('Ancien et nouveau mot de passe sont obligatoires.');
    }

    await this.authService.changePassword(userPayload.userId, oldPass, newPass);
    return { success: true, message: 'Mot de passe modifié avec succès.' };
  }
}

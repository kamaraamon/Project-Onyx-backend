import { Controller, Post, Get, Put, Body, Headers, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Wallet, WalletTransaction } from '@prisma/client';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /**
   * Endpoint pour initier un rechargement de solde Wave
   * POST /wallet/recharge
   */
  @Post('recharge')
  async initiateRecharge(
    @Headers('x-user-id') userId: string,
    @Body('amount') amount: number
  ) {
    if (!userId) {
      throw new BadRequestException('L\'en-tête x-user-id est obligatoire pour simuler l\'authentification.');
    }
    if (!amount || amount <= 0) {
      throw new BadRequestException('Le montant doit être supérieur à 0.');
    }
    return this.walletService.initiateRecharge(userId, amount);
  }

  /**
   * Webhook de retour de Wave pour notifier de la réussite ou de l'échec de la transaction
   * POST /wallet/webhook/wave
   */
  @Post('webhook/wave')
  @HttpCode(HttpStatus.OK)
  async waveWebhook(
    @Body('referenceId') referenceId: string,
    @Body('amount') amount: number,
    @Body('status') status: 'completed' | 'failed'
  ) {
    if (!referenceId || !status) {
      throw new BadRequestException('referenceId et status sont obligatoires dans le corps de la requête.');
    }
    return this.walletService.handleWaveWebhook(referenceId, amount, status);
  }

  /**
   * Historique des transactions du portefeuille
   * GET /wallet/history
   */
  @Get('history')
  async getHistory(@Headers('x-user-id') userId: string): Promise<WalletTransaction[]> {
    if (!userId) {
      throw new BadRequestException('L\'en-tête x-user-id est obligatoire.');
    }
    return this.walletService.getTransactionHistory(userId);
  }

  /**
   * Récupère l'état actuel du portefeuille (solde, curseur budgétaire)
   * GET /wallet
   */
  @Get()
  async getWallet(@Headers('x-user-id') userId: string): Promise<Wallet> {
    if (!userId) {
      throw new BadRequestException('L\'en-tête x-user-id est obligatoire.');
    }
    return this.walletService.getWallet(userId);
  }

  /**
   * Met à jour la limite du curseur budgétaire
   * PUT /wallet/budget-limit
   */
  @Put('budget-limit')
  async updateBudgetLimit(
    @Headers('x-user-id') userId: string,
    @Body('limit') limit: number
  ): Promise<Wallet> {
    if (!userId) {
      throw new BadRequestException('L\'en-tête x-user-id est obligatoire.');
    }
    if (limit === undefined || limit < 0) {
      throw new BadRequestException('Une limite valide est requise.');
    }
    return this.walletService.updateBudgetLimit(userId, limit);
  }
}

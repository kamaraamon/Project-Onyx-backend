import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initialise une demande de recharge via Wave
   */
  async initiateRecharge(userId: string, amount: number): Promise<{ paymentUrl: string; referenceId: string; totalCharged: number; fee: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId }
    });
    if (!wallet) {
      throw new NotFoundException('Portefeuille introuvable.');
    }

    // Calcul des frais selon le statut
    // Freemium : 1% à la charge du client
    // Premium : 0% de frais
    const feeRate = user.isPremium ? 0 : 0.01;
    const fee = amount * feeRate;
    const totalCharged = amount + fee;

    const referenceId = `WAVE_TX_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Création de la transaction en BDD à l'état pending
    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: amount,
        fee: fee,
        type: 'recharge',
        status: 'pending',
        referenceId: referenceId
      }
    });

    const paymentUrl = `https://checkout.wave.com/pay?ref=${referenceId}&amount=${totalCharged}&currency=XOF`;

    return {
      paymentUrl,
      referenceId,
      totalCharged,
      fee
    };
  }

  /**
   * Webhook appelé par Wave pour confirmer la transaction
   */
  async handleWaveWebhook(referenceId: string, waveAmount: number, status: 'completed' | 'failed'): Promise<any> {
    const transaction = await this.prisma.walletTransaction.findUnique({
      where: { referenceId }
    });
    if (!transaction) {
      throw new NotFoundException('Transaction non trouvée.');
    }

    if (transaction.status !== 'pending') {
      throw new BadRequestException('Cette transaction a déjà été traitée.');
    }

    // Mise à jour de la transaction et du solde de manière transactionnelle
    const updatedTransaction = await this.prisma.$transaction(async (tx) => {
      const updatedTx = await tx.walletTransaction.update({
        where: { id: transaction.id },
        data: { status }
      });

      if (status === 'completed') {
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: {
              increment: transaction.amount
            }
          }
        });
      }

      return updatedTx;
    });

    return updatedTransaction;
  }

  /**
   * Récupère l'historique complet des transactions d'un utilisateur
   */
  async getTransactionHistory(userId: string): Promise<any[]> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId }
    });
    if (!wallet) {
      throw new NotFoundException('Portefeuille introuvable.');
    }

    return this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Met à jour la limite budgétaire (curseur)
   */
  async updateBudgetLimit(userId: string, newLimit: number): Promise<any> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId }
    });
    if (!wallet) {
      throw new NotFoundException('Portefeuille introuvable.');
    }

    if (newLimit < 0) {
      throw new BadRequestException('La limite budgétaire ne peut pas être négative.');
    }

    return this.prisma.wallet.update({
      where: { userId },
      data: { budgetLimit: newLimit }
    });
  }

  /**
   * Récupère les infos du portefeuille courant
   */
  async getWallet(userId: string): Promise<any> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId }
    });
    if (!wallet) {
      throw new NotFoundException('Portefeuille introuvable.');
    }
    return wallet;
  }
}

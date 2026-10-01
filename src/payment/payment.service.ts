import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

export class RenewalFundsException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'RenewalFundsException';
  }
}

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recharge Wave simulee
   * POST /payment/deposit
   */
  async deposit(userId: string, amount: number): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    if (!user.wallet) {
      throw new NotFoundException('Portefeuille introuvable.');
    }

    // Calcul des frais : 1% pour les gratuits (freemium), 0% pour les Premium
    const feeRate = user.isPremium ? 0.0 : 0.01;
    const fee = amount * feeRate;
    const netAmount = amount - fee;

    // Mise a jour du solde et creation de la transaction financiere dans une transaction BDD
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Mettre a jour le solde du Wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            increment: netAmount
          }
        }
      });

      // 2. Enregistrer l'historique dans la table Transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          amount: netAmount,
          fee: fee,
          type: TransactionType.DEPOSIT_WAVE
        }
      });

      return { wallet: updatedWallet, transaction };
    });

    return {
      message: 'Recharge reussie.',
      userId,
      originalAmount: amount,
      fee,
      netCredited: netAmount,
      newBalance: Number(result.wallet.balance),
      transactionId: result.transaction.id
    };
  }

  /**
   * Verification des fonds pour le renouvellement (24h avant l'echeance)
   */
  async checkRenewalFunds(subscriptionId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: {
          include: { wallet: true }
        }
      }
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement introuvable.');
    }

    const wallet = subscription.user.wallet;
    if (!wallet) {
      throw new NotFoundException('Portefeuille introuvable pour cet abonnement.');
    }

    // Verifie si le solde du portefeuille est superieur ou egal au prix de l'abonnement
    const balanceNum = Number(wallet.balance);
    if (balanceNum < subscription.price) {
      throw new RenewalFundsException(
        `Fonds insuffisants pour renouveler l'abonnement ${subscription.name}. Requis: ${subscription.price} FCFA, Disponible: ${balanceNum} FCFA.`
      );
    }

    return true;
  }

  /**
   * Webhook Wave Squelette securise
   */
  async handleWaveWebhook(payload: any, signature: string): Promise<any> {
    if (!signature) {
      throw new BadRequestException('Signature Webhook Wave manquante.');
    }

    // Simulation de validation de signature
    const isValid = signature === 'valid_wave_signature_mock';
    if (!isValid) {
      throw new BadRequestException('Signature Webhook Wave invalide.');
    }

    const { userId, amount } = payload;
    if (!userId || !amount) {
      throw new BadRequestException('Payload Wave invalide.');
    }

    // Traite le depot de production
    return this.deposit(userId, amount);
  }
}

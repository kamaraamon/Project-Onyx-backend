import { WalletService } from './wallet.service';
import { Wallet, WalletTransaction } from '@prisma/client';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    initiateRecharge(userId: string, amount: number): Promise<{
        paymentUrl: string;
        referenceId: string;
        totalCharged: number;
        fee: number;
    }>;
    waveWebhook(referenceId: string, amount: number, status: 'completed' | 'failed'): Promise<any>;
    getHistory(userId: string): Promise<WalletTransaction[]>;
    getWallet(userId: string): Promise<Wallet>;
    updateBudgetLimit(userId: string, limit: number): Promise<Wallet>;
}

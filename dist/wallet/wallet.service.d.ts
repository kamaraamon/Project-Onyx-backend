import { PrismaService } from '../prisma/prisma.service';
export declare class WalletService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    initiateRecharge(userId: string, amount: number): Promise<{
        paymentUrl: string;
        referenceId: string;
        totalCharged: number;
        fee: number;
    }>;
    handleWaveWebhook(referenceId: string, waveAmount: number, status: 'completed' | 'failed'): Promise<any>;
    getTransactionHistory(userId: string): Promise<any[]>;
    updateBudgetLimit(userId: string, newLimit: number): Promise<any>;
    getWallet(userId: string): Promise<any>;
}

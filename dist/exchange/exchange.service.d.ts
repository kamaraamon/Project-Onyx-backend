import { PrismaService } from '../prisma/prisma.service';
export declare class ExchangeService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    proposeExchange(userId: string, userPhone: string, offeredSubName: string, wantedSubName: string): Promise<any>;
    getListings(): Promise<any[]>;
    acceptExchange(userId: string, exchangeId: string): Promise<any>;
    reportUser(targetUserId: string, reason: string): Promise<{
        targetUserId: string;
        newScore: number;
    }>;
    getTrustScore(userId: string): Promise<number>;
    claimBackupProfile(userId: string, exchangeId: string): Promise<any>;
    getBackupClaims(userId: string): Promise<any[]>;
}

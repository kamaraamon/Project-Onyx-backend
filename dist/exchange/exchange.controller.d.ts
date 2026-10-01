import { ExchangeService } from './exchange.service';
import { Exchange } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
export declare class ExchangeController {
    private readonly exchangeService;
    private readonly authService;
    constructor(exchangeService: ExchangeService, authService: AuthService);
    private getAuthenticatedUser;
    proposeExchange(authHeader: string, offeredSubName: string, wantedSubName: string): Promise<Exchange>;
    getListings(): Promise<Exchange[]>;
    acceptExchange(authHeader: string, id: string): Promise<Exchange>;
    getTrustScore(authHeader: string): Promise<{
        trustScore: number;
    }>;
    reportUser(authHeader: string, targetUserId: string, reason: string): Promise<{
        targetUserId: string;
        newScore: number;
    }>;
    claimBackup(authHeader: string, exchangeId: string): Promise<any>;
}

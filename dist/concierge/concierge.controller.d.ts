import { ConciergeService } from './concierge.service';
import { ConciergeRequest, SecurityAlert } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
export declare class ConciergeController {
    private readonly conciergeService;
    private readonly authService;
    constructor(conciergeService: ConciergeService, authService: AuthService);
    private getAuthenticatedUserId;
    createRequest(authHeader: string, actionType: 'activation' | 'suspension' | 'resiliation' | 'swapping', serviceName: string): Promise<ConciergeRequest>;
    getRequests(authHeader: string): Promise<ConciergeRequest[]>;
    completeRequest(authHeader: string, id: string): Promise<ConciergeRequest>;
    getAlerts(authHeader: string): Promise<SecurityAlert[]>;
}

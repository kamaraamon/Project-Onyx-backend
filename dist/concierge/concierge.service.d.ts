import { PrismaService } from '../prisma/prisma.service';
export declare class ConciergeService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createRequest(userId: string, actionType: 'activation' | 'suspension' | 'resiliation' | 'swapping', serviceName: string): Promise<any>;
    getRequests(userId: string): Promise<any[]>;
    completeRequest(requestId: string): Promise<any>;
    getAlerts(userId: string): Promise<any[]>;
}

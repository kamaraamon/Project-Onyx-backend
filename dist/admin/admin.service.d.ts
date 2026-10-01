import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';
export declare class AdminService {
    private readonly prisma;
    private readonly encryptionService;
    constructor(prisma: PrismaService, encryptionService: EncryptionService);
    getTasks(): Promise<any[]>;
    decryptCredentials(coffreFortId: string): Promise<any>;
    resolveLitigation(litigationId: string): Promise<any>;
    createMockDataForTesting(): Promise<any>;
}

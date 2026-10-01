import { CryptoService } from '../common/services/crypto.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class VaultService {
    private readonly prisma;
    private readonly cryptoService;
    constructor(prisma: PrismaService, cryptoService: CryptoService);
    addCredentials(userId: string, serviceName: string, username: string, password: string): Promise<{
        id: string;
        serviceName: string;
        createdAt: Date;
    }>;
    getCredentials(userId: string): Promise<any[]>;
    deleteCredentials(userId: string, entryId: string): Promise<void>;
}

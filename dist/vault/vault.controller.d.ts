import { VaultService } from './vault.service';
import { AuthService } from '../auth/auth.service';
export declare class VaultController {
    private readonly vaultService;
    private readonly authService;
    constructor(vaultService: VaultService, authService: AuthService);
    private getAuthenticatedUserId;
    addCredentials(authHeader: string, serviceName: string, username: string, password?: string): Promise<{
        id: string;
        serviceName: string;
        createdAt: Date;
    }>;
    getCredentials(authHeader: string): Promise<any[]>;
    deleteCredentials(authHeader: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}

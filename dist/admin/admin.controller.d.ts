import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getTasks(): Promise<any[]>;
    decryptCredentials(coffreFortId: string): Promise<any>;
    resolveLitigation(litigationId: string): Promise<any>;
    generateMockData(): Promise<any>;
}

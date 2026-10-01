import { PrismaService } from './prisma/prisma.service';
export declare class AppController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getIndex(): Promise<string>;
    getAdminUsers(adminKey: string): Promise<({
        wallet: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            balance: import("@prisma/client/runtime/library").Decimal;
            budgetLimit: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        phone: string;
        passwordHash: string;
        isPremium: boolean;
        trustScore: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    adminResetPassword(adminKey: string, body: {
        phone: string;
        newPass: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}

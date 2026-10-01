import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    register(phone: string, password: string): Promise<{
        id: string;
        phone: string;
        isPremium: boolean;
    }>;
    login(phone: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            phone: string;
            isPremium: boolean;
        };
    }>;
    changePassword(userId: string, oldPass: string, newPass: string): Promise<void>;
    validateToken(token: string): {
        userId: string;
        phone: string;
        isPremium: boolean;
    };
}

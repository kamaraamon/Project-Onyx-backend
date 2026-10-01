import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(phone: string, password?: string): Promise<{
        id: string;
        phone: string;
        isPremium: boolean;
    }>;
    login(phone: string, password?: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            phone: string;
            isPremium: boolean;
        };
    }>;
    getProfile(authHeader?: string): Promise<{
        userId: string;
        phone: string;
        isPremium: boolean;
    }>;
    changePassword(authHeader: string, oldPass: string, newPass: string): Promise<{
        success: boolean;
        message: string;
    }>;
}

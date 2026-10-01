import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class AdminGuard implements CanActivate {
    private readonly ADMIN_SECRET_KEY;
    canActivate(context: ExecutionContext): boolean;
}

import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly ADMIN_SECRET_KEY = 'admin123';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const adminKey = request.headers['x-admin-key'];

    if (adminKey !== this.ADMIN_SECRET_KEY) {
      throw new ForbiddenException('Acces refuse. Cle d\'administration Onyx invalide.');
    }

    return true;
  }
}

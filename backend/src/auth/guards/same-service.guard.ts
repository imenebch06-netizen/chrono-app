// src/auth/guards/same-service.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '../enums/role.enum';

@Injectable()
export class SameServiceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Injecté par JwtAuthGuard
    const targetServiceId = Number(request.params.serviceId);

    // 1. Si c'est un ADMIN, il a tous les droits
    if (user.role === Role.ADMIN) {
      return true;
    }

    // 2. Si c'est un MANAGER, on vérifie que le service demandé est BIEN le sien
    if (user.role === Role.MANAGER) {
      if (user.serviceId === targetServiceId) {
        return true;
      }
      throw new ForbiddenException("Vous n'avez pas accès aux données d'un autre service.");
    }

    // 3. Les employés simples n'ont pas accès aux vues par service
    throw new ForbiddenException('Accès refusé.');
  }
}

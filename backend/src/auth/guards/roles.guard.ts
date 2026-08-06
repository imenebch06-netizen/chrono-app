// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Récupérer les rôles définis sur le Controller ou le Handler
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Si aucun rôle n'est spécifié, la route est accessible par tout utilisateur authentifié
    if (!requiredRoles) {
      return true;
    }

    // 3. Récupérer l'utilisateur depuis la requête (mis par le JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // 4. Vérifier si l'utilisateur possède l'un des rôles autorisés
    return requiredRoles.some((role) => user?.role === role);
  }
}

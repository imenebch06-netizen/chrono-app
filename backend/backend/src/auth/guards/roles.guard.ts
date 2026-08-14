// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { Role, ExtendedRole } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Récupérer les rôles exigés sur la route ou le contrôleur
    const requiredRoles = this.reflector.getAllAndOverride<ExtendedRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Si aucun rôle n'est spécifié, la route est libre d'accès pour tout utilisateur authentifié
    if (!requiredRoles) {
      return true;
    }

    // 3. Récupérer l'utilisateur injecté par JwtAuthGuard / JwtStrategy
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    // 🔑 4. L'ADMIN a un accès global sur toutes les routes protégées
    if (user.role === Role.ADMIN) {
      return true;
    }

    // 🔑 5. Vérification dynamique des rôles requis
    return requiredRoles.some((role) => {
      // Si la route exige un "MANAGER"
      if (role === 'MANAGER') {
        return user.isManager === true;
      }

      // Sinon vérification classique sur le rôle BDD (ex: EMPLOYE, ADMIN)
      return user.role === role;
    });
  }
}
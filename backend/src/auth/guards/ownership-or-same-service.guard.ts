// src/auth/guards/ownership-or-same-service.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../enums/role.enum';

@Injectable()
export class OwnershipOrSameServiceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user; // Injecté par JwtAuthGuard

    // Récupère l'ID employé depuis req.params.id ou req.params.employeId
    const targetEmployeId = Number(req.params.id || req.params.employeId);

    if (!targetEmployeId || isNaN(targetEmployeId)) {
      return true; // Pas d'ID employé spécifié dans l'URL, on laisse passer au guard suivant
    }

    // 1. ADMIN -> Accès total
    if (user.role === Role.ADMIN) return true;

    // 2. PROPRE PROFIL (Self) -> Accès autorisé
    if (user.id === targetEmployeId) return true;

    // 3. MANAGER -> Doit être du même service que l'employé ciblé
    if (user.role === Role.MANAGER) {
      const targetEmploye = await this.prisma.employe.findUnique({
        where: { id: targetEmployeId },
        select: { serviceId: true },
      });

      if (!targetEmploye) {
        throw new NotFoundException('Employé introuvable.');
      }

      if (user.serviceId === targetEmploye.serviceId) {
        return true;
      }
    }

    // Si aucune condition n'est remplie -> Accès refusé
    throw new ForbiddenException("Vous n'avez pas les droits nécessaires pour accéder à cette ressource.");
  }
}
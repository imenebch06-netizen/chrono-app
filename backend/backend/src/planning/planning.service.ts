import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanningDto } from './dto/create-planning.dto';
import { Role } from '../auth/enums/role.enum';

@Injectable()
export class PlanningService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // 1. CRÉATION DE PLANNING (Simple ou Multi-Employés)
  // =========================================================================
  async create(dto: CreatePlanningDto, user: any) {
  const currentUserId = Number(user?.id ?? user?.sub);
  const items = dto.planning;

  if (!items || items.length === 0) {
    throw new BadRequestException('Le tableau "planning" ne peut pas être vide.');
  }

  // 1. Extraction de tous les IDs d'employés uniques ciblés dans le tableau
  const uniqueEmployeIds = Array.from(
    new Set(items.map((item) => Number(item.employeId))),
  );

  // 2. Vérification des droits hiérarchiques si l'utilisateur n'est PAS ADMIN
  if (user?.role !== Role.ADMIN) {
    const managedOrg = await this.prisma.organization.findFirst({
      where: { managerId: currentUserId },
    });

    if (!managedOrg || !managedOrg.path) {
      throw new ForbiddenException("Vous n'êtes responsable d'aucune organisation.");
    }

    // Récupérer tous les employés concernés avec leur organisation
    const employes = await this.prisma.employe.findMany({
      where: { id: { in: uniqueEmployeIds } },
      include: { organization: true },
    });

    if (employes.length !== uniqueEmployeIds.length) {
      throw new NotFoundException('Un ou plusieurs employés cibles sont introuvables.');
    }

    // S'assurer que CHACUN des employés appartient à la branche du manager
    const managerPath = managedOrg.path;
    for (const emp of employes) {
      const empPath = emp.organization?.path;
      const isSubordinate = Boolean(empPath) && empPath!.startsWith(managerPath);

      if (!isSubordinate) {
        throw new ForbiddenException(
          `Vous n'avez pas les droits pour assigner un planning à l'employé #${emp.id} (${emp.nom} ${emp.prenom}).`,
        );
      }
    }
  }

  // 3. Préparation des données pour l'insertion
  const planningData = items.map((item) => ({
    employeId: Number(item.employeId),
    dateDebut: new Date(item.dateDebut),
    dateFin: new Date(item.dateFin),
    type_travail: item.type_travail,
    heureDebut: item.heureDebut ?? null,
    heureFin: item.heureFin ?? null,
    typeShift: item.typeShift ?? null,
    plageFixeDebut: item.plageFixeDebut ?? null,
    plageFixeFin: item.plageFixeFin ?? null,
    joursRepos:
      typeof item.joursRepos === 'object'
        ? JSON.stringify(item.joursRepos)
        : item.joursRepos ?? null,
  }));

  // 🟢 4. TRANSACTION PRISMA (Nettoyage + Insertion)
  // On supprime d'abord les anciens plannings des employés concernés
  // puis on insère les nouveaux de manière atomique.
  await this.prisma.$transaction([
    this.prisma.planning.deleteMany({
      where: {
        employeId: { in: uniqueEmployeIds },
      },
    }),
    this.prisma.planning.createMany({
      data: planningData,
    }),
  ]);

  return {
    message: `${planningData.length} élément(s) de planning enregistré(s) avec succès.`,
    count: planningData.length,
  };
}
  // =========================================================================
  // 2. LECTURE & CONSULTATION
  // =========================================================================

  // A. Planning personnel
  async findMyPlanning(employeId: number, startDate?: string, endDate?: string) {
    const dateWhere: any = {};
    if (startDate) dateWhere.dateFin = { gte: new Date(startDate) };
    if (endDate) dateWhere.dateDebut = { lte: new Date(endDate) };

    return this.prisma.planning.findMany({
      where: {
        employeId,
        ...dateWhere,
      },
      orderBy: { dateDebut: 'asc' },
    });
  }

  // B. Planning de l'équipe du Manager (Arbre hiérarchique)
  async findTeamPlanning(managerId: number, startDate?: string, endDate?: string) {
    const managedOrg = await this.prisma.organization.findFirst({
      where: { managerId },
    });

    if (!managedOrg || !managedOrg.path) {
      return [];
    }

    const dateWhere: any = {};
    if (startDate) dateWhere.dateFin = { gte: new Date(startDate) };
    if (endDate) dateWhere.dateDebut = { lte: new Date(endDate) };

    return this.prisma.planning.findMany({
      where: {
        ...dateWhere,
        employe: {
          organization: {
            path: { startsWith: managedOrg.path },
          },
        },
      },
      include: {
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            organization: { select: { id: true, nom: true } },
          },
        },
      },
      orderBy: { dateDebut: 'asc' },
    });
  }

  // C. Planning global (Vue Admin)
  async findAllPlanning(startDate?: string, endDate?: string, organizationId?: number) {
    const dateWhere: any = {};
    if (startDate) dateWhere.dateFin = { gte: new Date(startDate) };
    if (endDate) dateWhere.dateDebut = { lte: new Date(endDate) };

    let orgFilter = {};
    if (organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });
      if (org && org.path) {
        orgFilter = {
          organization: { path: { startsWith: org.path } },
        };
      }
    }

    return this.prisma.planning.findMany({
      where: {
        ...dateWhere,
        employe: {
          ...orgFilter,
        },
      },
      include: {
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            organization: { select: { id: true, nom: true } },
          },
        },
      },
      orderBy: { dateDebut: 'asc' },
    });
  }

  // =========================================================================
  // 3. SUPPRESSION DU PLANNING
  // =========================================================================
  async remove(id: number, user: any) {
    const currentUserId = Number(user?.id ?? user?.sub);

    const planning = await this.prisma.planning.findUnique({
      where: { id },
      include: {
        employe: { include: { organization: true } },
      },
    });

    if (!planning) {
      throw new NotFoundException(`Planning #${id} introuvable.`);
    }

    // Vérification des droits pour la suppression si non Admin
    if (user?.role !== Role.ADMIN) {
      const managedOrg = await this.prisma.organization.findFirst({
        where: { managerId: currentUserId },
      });

      const empPath = planning.employe.organization?.path;
      const managerPath = managedOrg?.path;
      const isSubordinate = Boolean(empPath) && Boolean(managerPath) && empPath!.startsWith(managerPath!);

      if (!isSubordinate) {
        throw new ForbiddenException("Vous n'avez pas les droits pour supprimer ce planning.");
      }
    }

    return this.prisma.planning.delete({ where: { id } });
  }
}
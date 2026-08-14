import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ajuste le chemin selon ton projet

type CreateOrganizationDto = {
  nom: string;
  typeOrganizationId: number;
  idOrganizationSup?: number | null;
  managerId?: number | null;
};

type AssignManagerDto = {
  managerId?: number | null;
};

type UpdateOrganizationDto = {
  nom?: string;
  typeOrganizationId?: number;
  idOrganizationSup?: number | null;
};

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // 1. CRÉATION D'UNE ORGANISATION
  // =========================================================================
  async create(dto: CreateOrganizationDto) {
    let parentPath = '';

    // A. Contrôle du Parent
    if (dto.idOrganizationSup) {
      const parent = await this.prisma.organization.findUnique({
        where: { id: dto.idOrganizationSup },
      });
      if (!parent) {
        throw new NotFoundException(
          `L'organisation parente avec l'ID ${dto.idOrganizationSup} n'existe pas.`,
        );
      }
      parentPath = parent.path ?? '';
    }

    // B. Validation du Manager si fourni à la création
    if (dto.managerId) {
      await this.validateManagerAvailability(dto.managerId);
    }

    // C. Création initiale pour obtenir l'ID
    const newOrg = await this.prisma.organization.create({
      data: {
        nom: dto.nom,
        typeOrganizationId: dto.typeOrganizationId,
        idOrganizationSup: dto.idOrganizationSup ?? null,
        managerId: dto.managerId ?? null,
      },
    });

    // D. Calcul automatique du PATH
    const calculatedPath = parentPath
      ? `${parentPath}/${newOrg.id}`
      : `${newOrg.id}`;

    // E. Sauvegarde du path et retour du résultat
    return this.prisma.organization.update({
      where: { id: newOrg.id },
      data: { path: calculatedPath },
      include: {
        typeOrganization: true,
        parent: true,
        manager: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });
  }

  // =========================================================================
  // 2. GESTION DU MANAGER (AFFECTER / RETIRER)
  // =========================================================================
  async assignManager(orgId: number, dto: AssignManagerDto) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException(`L'organisation #${orgId} est introuvable.`);
    }

    // --- CAS A : Retirer le manager (managerId = null) ---
    if (!dto.managerId) {
      return this.prisma.organization.update({
        where: { id: orgId },
        data: { managerId: null },
        include: {
          typeOrganization: true,
          manager: true,
        },
      });
    }

    // --- CAS B : Affecter un nouveau manager ---
    // 1. Vérifier si l'employé existe et récupérer son organisation rattachée
    const employe = await this.prisma.employe.findUnique({
      where: { id: dto.managerId },
      include: { organization: { select: { id: true, path: true } } } as any,
    });

    if (!employe) {
      throw new NotFoundException(
        `L'employé avec l'ID ${dto.managerId} est introuvable.`,
      );
    }

    // 2. Règle d'unicité : Vérifier s'il est DÉJÀ manager d'une autre organisation
    const existingManagedOrg = await this.prisma.organization.findFirst({
      where: {
        managerId: dto.managerId,
        NOT: { id: orgId }, // Exclure l'organisation actuelle
      },
    });

    if (existingManagedOrg) {
      throw new BadRequestException(
        `L'employé ${employe.prenom} ${employe.nom} est déjà le manager de "${existingManagedOrg.nom}".`,
      );
    }

    // 3. Règle de branche : L'employé doit appartenir à cette organisation ou sa descendance
    // Normaliser le résultat : prisma peut renvoyer soit un objet soit un tableau
    const employeOrg = Array.isArray(employe.organization)
      ? employe.organization[0]
      : (employe.organization as any);

    if (!employeOrg || !(employeOrg as any).path) {
      throw new BadRequestException(
        `L'employé n'est rattaché à aucune organisation. Il doit appartenir à la branche de "${org.nom}".`,
      );
    }

    if (!org.path || !(employeOrg as any).path.startsWith(org.path)) {
      throw new BadRequestException(
        `L'employé ${employe.prenom} ${employe.nom} n'appartient pas à la branche de "${org.nom}".`,
      );
    }

    // 4. Affectation (L'employé conserve son organizationId d'origine)
    return this.prisma.organization.update({
      where: { id: orgId },
      data: { managerId: dto.managerId },
      include: {
        typeOrganization: true,
        manager: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });
  }

  // =========================================================================
  // 3. RECHERCHE ET DESCENDANCE (RECHERCHE RÉCURSIVE VIA PATH)
  // =========================================================================
  async getSubOrganizations(orgId: number) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org || !org.path) {
      throw new NotFoundException(`L'organisation #${orgId} est introuvable.`);
    }

    // Récupération instantanée de toute la sous-arborescence en 1 requête SQL
    return this.prisma.organization.findMany({
      where: {
        path: {
          startsWith: org.path, // Ex: Récupère "1/2", "1/2/3", "1/2/3/4"
        },
      },
      include: {
        typeOrganization: true,
        manager: { select: { id: true, nom: true, prenom: true } },
        parent: { select: { id: true, nom: true } },
      },
      orderBy: { path: 'asc' },
    });
  }

  // =========================================================================
  // 4. MODIFICATION ET DÉPLACEMENT
  // =========================================================================
  async update(id: number, dto: UpdateOrganizationDto) {
    const currentOrg = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!currentOrg || !currentOrg.path) {
      throw new NotFoundException(`L'organisation #${id} est introuvable.`);
    }

    const isParentChanging =
      dto.idOrganizationSup !== undefined &&
      dto.idOrganizationSup !== currentOrg.idOrganizationSup;

    // --- MODIFICATION SIMPLE (Pas de changement de parent) ---
    if (!isParentChanging) {
      return this.prisma.organization.update({
        where: { id },
        data: {
          nom: dto.nom,
          typeOrganizationId: dto.typeOrganizationId,
        },
        include: { typeOrganization: true, parent: true, manager: true },
      });
    }

    // --- DÉPLACEMENT D'ARBRE (Changement de parent) ---
    let newPath = `${id}`;

    if (dto.idOrganizationSup !== null) {
      if (dto.idOrganizationSup === id) {
        throw new BadRequestException(
          `Une organisation ne peut pas être son propre parent.`,
        );
      }

      const newParent = await this.prisma.organization.findUnique({
        where: { id: dto.idOrganizationSup },
      });

      if (!newParent || !newParent.path) {
        throw new NotFoundException(
          `Le nouveau parent #${dto.idOrganizationSup} n'existe pas.`,
        );
      }

      // Protection contre la dépendance circulaire
      if (newParent.path.startsWith(currentOrg.path)) {
        throw new BadRequestException(
          `Déplacement impossible : la cible est un sous-service de l'organisation actuelle.`,
        );
      }

      newPath = `${newParent.path}/${id}`;
    }

    const oldPath = currentOrg.path;

    // Transaction pour mettre à jour le nœud et toute sa descendance
    return this.prisma.$transaction(async (tx) => {
      const txClient = tx as typeof this.prisma;

      // 1. Récupérer les sous-services enfants
      const descendants = await txClient.organization.findMany({
        where: {
          path: {
            startsWith: `${oldPath}/`,
          },
        },
      });

      // 2. Mettre à jour l'organisation déplacée
      const updatedOrg = await txClient.organization.update({
        where: { id },
        data: {
          nom: dto.nom,
          typeOrganizationId: dto.typeOrganizationId,
          idOrganizationSup: dto.idOrganizationSup ?? null,
          path: newPath,
        },
        include: { typeOrganization: true, parent: true, manager: true },
      });

      // 3. Mettre à jour en cascade les paths de toute la descendance
      for (const child of descendants) {
        if (child.path) {
          const childNewPath = child.path.replace(oldPath, newPath);
          await txClient.organization.update({
            where: { id: child.id },
            data: { path: childNewPath },
          });
        }
      }

      return updatedOrg;
    });
  }

  // =========================================================================
  // 5. SUPPRESSION SÉCURISÉE
  // =========================================================================
  async delete(id: number) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!org) {
      throw new NotFoundException(`L'organisation #${id} est introuvable.`);
    }

    // Protection des enfants : Bloquer si des sous-services existent
    if (org.children && org.children.length > 0) {
      throw new BadRequestException(
        `Impossible de supprimer cette organisation car elle contient encore ${org.children.length} sous-organisation(s). Veuillez d'abord les déplacer ou les supprimer.`,
      );
    }

    // La suppression détache automatiquement les employés rattachés (SetNull configuré sur Prisma)
    return this.prisma.organization.delete({
      where: { id },
    });
  }

  // =========================================================================
// 6. OBTENIR L'ARBRE HIÉRARCHIQUE COMPLET POUR LE SIDEBAR
// =========================================================================
async getTree() {
  // A. Récupération de toutes les organisations avec le nombre de membres
  const orgs = await this.prisma.organization.findMany({
    include: {
      typeOrganization: true,
      manager: { select: { id: true, nom: true, prenom: true } },
      _count: { select: { membres: true } }, // 📊 Effectif direct rattaché
    },
    orderBy: { path: 'asc' },
  });

  // B. Construction ultra-rapide de l'arbre en mémoire
  const orgMap = new Map<number, any>();
  const tree: any[] = [];

  // Étape 1: Indexation dans une Map
  orgs.forEach((org) => {
    orgMap.set(org.id, { ...org, children: [], isExpanded: true });
  });

  // Étape 2: Imbrication Parent -> Enfants
  orgMap.forEach((org) => {
    if (org.idOrganizationSup && orgMap.has(org.idOrganizationSup)) {
      orgMap.get(org.idOrganizationSup).children.push(org);
    } else {
      tree.push(org); // Nœud racine (DG ou top-level)
    }
  });

  return tree;
}

  // =========================================================================
  // LECTURES ANNEXES
  // =========================================================================
  async findAll() {
    return this.prisma.organization.findMany({
      include: {
        typeOrganization: true,
        manager: { select: { id: true, nom: true, prenom: true } },
        parent: { select: { id: true, nom: true } },
      },
      orderBy: { path: 'asc' },
    });
  }

 async findAllTypes() {
  return this.prisma.typeOrganization.findMany({
    orderBy: {
      id: 'asc', // Trie simplement par ordre (1, 2, 3, 4)
    },
  });
}

  async findOne(id: number) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        typeOrganization: true,
        parent: true,
        children: { include: { typeOrganization: true } },
        manager: { select: { id: true, nom: true, prenom: true, email: true } },
        membres: { select: { id: true, nom: true, prenom: true, role: true } },
      },
    });

    if (!org) {
      throw new NotFoundException(`L'organisation #${id} est introuvable.`);
    }

    return org;
  }

  // Helper privé
  private async validateManagerAvailability(managerId: number) {
    const existing = await this.prisma.organization.findUnique({
      where: { managerId },
    });
    if (existing) {
      throw new BadRequestException(
        `Cet employé est déjà le manager de "${existing.nom}".`,
      );
    }
  }

}
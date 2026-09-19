import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
type CreateOrganizationDto = {
  nom: string;
  nom_en?: string;
  typeOrganizationId: number;
  idOrganizationSup?: number | null;
  managerId?: number | null;
};

type AssignManagerDto = {
  managerId?: number | null;
};


@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto) {
    let parentPath = '';

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

    if (dto.managerId) {
      await this.validateManagerAvailability(dto.managerId);
    }

    const newOrg = await this.prisma.organization.create({
      data: {
        nom: dto.nom,
        nom_en: dto.nom_en ?? null,
        typeOrganizationId: dto.typeOrganizationId,
        idOrganizationSup: dto.idOrganizationSup ?? null,
        managerId: dto.managerId ?? null,
      },
    });

    const calculatedPath = parentPath
      ? `${parentPath}/${newOrg.id}`
      : `${newOrg.id}`;

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

    async assignManager(orgId: number, dto: AssignManagerDto) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException(`L'organisation #${orgId} est introuvable.`);
    }

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

    const employe = await this.prisma.employe.findUnique({
      where: { id: dto.managerId },
      include: { organization: { select: { id: true, path: true } } } as any,
    });

    if (!employe) {
      throw new NotFoundException(
        `L'employé avec l'ID ${dto.managerId} est introuvable.`,
      );
    }

    const existingManagedOrg = await this.prisma.organization.findFirst({
      where: {
        managerId: dto.managerId,
        NOT: { id: orgId },
      },
    });

    if (existingManagedOrg) {
      throw new BadRequestException(
        `L'employé ${employe.prenom} ${employe.nom} est déjà le manager de "${existingManagedOrg.nom}".`,
      );
    }

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

    async getSubOrganizations(orgId: number) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org || !org.path) {
      throw new NotFoundException(`L'organisation #${orgId} est introuvable.`);
    }

    return this.prisma.organization.findMany({
      where: {
        path: {
          startsWith: org.path,
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

  async update(id: number | string, dto: UpdateOrganizationDto) {
  const numericId = Number(id);

  if (isNaN(numericId)) {
    throw new BadRequestException("L'ID d'organisation fourni est invalide.");
  }

  const currentOrg = await this.prisma.organization.findUnique({
    where: { id: numericId },
  });

  if (!currentOrg || !currentOrg.path) {
    throw new NotFoundException(`L'organisation #${numericId} est introuvable.`);
  }

  const isParentChanging =
    dto.idOrganizationSup !== undefined &&
    dto.idOrganizationSup !== currentOrg.idOrganizationSup;

  if (!isParentChanging) {
    const dataToUpdate: any = {};
    if (dto.nom !== undefined) dataToUpdate.nom = dto.nom;
    if (dto.nom_en !== undefined) dataToUpdate.nom_en = dto.nom_en;
    if (dto.typeOrganizationId !== undefined && !isNaN(Number(dto.typeOrganizationId))) {
      dataToUpdate.typeOrganizationId = Number(dto.typeOrganizationId);
    }

    return this.prisma.organization.update({
      where: { id: numericId },
      data: dataToUpdate,
      include: { typeOrganization: true, parent: true, manager: true },
    });
  }

  let newPath = `${numericId}`;

  if (dto.idOrganizationSup !== null && dto.idOrganizationSup !== undefined) {
    const targetParentId = Number(dto.idOrganizationSup);

    if (targetParentId === numericId) {
      throw new BadRequestException(`Une organisation ne peut pas être son propre parent.`);
    }

    const newParent = await this.prisma.organization.findUnique({
      where: { id: targetParentId },
    });

    if (!newParent || !newParent.path) {
      throw new NotFoundException(`Le nouveau parent #${targetParentId} n'existe pas.`);
    }

    if (newParent.path.startsWith(currentOrg.path)) {
      throw new BadRequestException(`Déplacement impossible : la cible est un sous-service de l'organisation actuelle.`);
    }

    newPath = `${newParent.path}/${numericId}`;
  }

  const oldPath = currentOrg.path;

  return this.prisma.$transaction(async (tx) => {
    const txClient = tx as typeof this.prisma;

    const descendants = await txClient.organization.findMany({
      where: {
        path: { startsWith: `${oldPath}/` },
      },
    });

    const dataToUpdate: any = {
      path: newPath,
      idOrganizationSup: dto.idOrganizationSup ? Number(dto.idOrganizationSup) : null,
    };
    if (dto.nom !== undefined) dataToUpdate.nom = dto.nom;
    if (dto.nom_en !== undefined) dataToUpdate.nom_en = dto.nom_en;
    if (dto.typeOrganizationId !== undefined && !isNaN(Number(dto.typeOrganizationId))) {
      dataToUpdate.typeOrganizationId = Number(dto.typeOrganizationId);
    }

    const updatedOrg = await txClient.organization.update({
      where: { id: numericId },
      data: dataToUpdate,
      include: { typeOrganization: true, parent: true, manager: true },
    });

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

  async delete(id: number) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!org) {
      throw new NotFoundException(`L'organisation #${id} est introuvable.`);
    }

    if (org.children && org.children.length > 0) {
      throw new BadRequestException(
        `Impossible de supprimer cette organisation car elle contient encore ${org.children.length} sous-organisation(s). Veuillez d'abord les déplacer ou les supprimer.`,
      );
    }

    return this.prisma.organization.delete({
      where: { id },
    });
  }

 async getTree() {
  const orgs = await this.prisma.organization.findMany({
    include: {
      typeOrganization: true,
      manager: { select: { id: true, nom: true, prenom: true } },
      _count: { select: { membres: true } },
    },
    orderBy: { path: 'asc' },
  });

  const orgMap = new Map<number, any>();
  const tree: any[] = [];

  orgs.forEach((org) => {
    orgMap.set(org.id, { ...org, children: [], isExpanded: true });
  });

  orgMap.forEach((org) => {
    if (org.idOrganizationSup && orgMap.has(org.idOrganizationSup)) {
      orgMap.get(org.idOrganizationSup).children.push(org);
    } else {
      tree.push(org);
    }
  });

  return tree;
}

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
      id: 'asc', 
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
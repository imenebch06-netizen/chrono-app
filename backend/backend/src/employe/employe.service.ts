//@ts-nocheck
import { Injectable, ConflictException, NotFoundException,BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeDto } from './dto/create-employe.dto';
import * as bcrypt from 'bcrypt';
import { UpdateEmployeDto } from './dto/update-employe.dto';
import { Role } from '@prisma/client';

@Injectable()
export class EmployeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEmployeDto: CreateEmployeDto) {
    const existing = await this.prisma.employe.findUnique({
      where: { email: createEmployeDto.email },
    });
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé.');
    }
    if (createEmployeDto.organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: createEmployeDto.organizationId },
      });
      if (!org) {
        throw new NotFoundException(
          `L'organisation #${createEmployeDto.organizationId} est introuvable.`,
        );
      }
    }

    const hashedPassword = await bcrypt.hash(createEmployeDto.password, 10);

    return this.prisma.employe.create({
      data: {
        nom: createEmployeDto.nom,
        prenom: createEmployeDto.prenom,
        email: createEmployeDto.email,
        password: hashedPassword,
        adress: createEmployeDto.adress,
        adress_en: createEmployeDto.adress_en ?? null,
        latitude: createEmployeDto.latitude ?? null,
        longitude: createEmployeDto.longitude ?? null,
        role: createEmployeDto.role ?? 'EMPLOYE',
        organizationId: createEmployeDto.organizationId ?? null,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        adress: true,
        adress_en: true,
        latitude: true,
        longitude: true,
        organizationId: true,
        organization:{
          select:{
            id:true,
            nom:true,
            nom_en: true
          },
        },
        createdAt: true,
      },
    });
  }



  async findAll() {
    return this.prisma.employe.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        adress: true,
        adress_en: true,
        latitude: true,
        longitude: true,
        organizationId: true,
        organization:{
          select:{
            id:true,
            nom:true,
          },
        },
        createdAt: true,
      },
    });
  }

  async findOne(id: number) {
    const employe = await this.prisma.employe.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            nom: true,
            nom_en: true,
            typeOrganization: true,
            path: true,
          },
        },
      },
    });

    if (!employe) {
      throw new NotFoundException(`Employé avec l'ID ${id} introuvable.`);
    }

    const { password, ...result } = employe;
    return result;
  }

  async findByEmail(email: string) {
    return this.prisma.employe.findUnique({
      where: { email },
    });
  }

  async update(id: number | string, updateEmployeDto: UpdateEmployeDto) {
    const numericId = Number(id);

    if (isNaN(numericId)) {
      throw new BadRequestException("L'ID fourni est invalide.");
    }

    await this.findOne(numericId);

    const { nom, prenom, email, password, adress, adress_en,latitude, longitude, role, organizationId } = updateEmployeDto;

    if (email) {
      const existingEmail = await this.prisma.employe.findFirst({
        where: {
          email,
          NOT: { id: numericId },
        },
      });
      if (existingEmail) {
        throw new ConflictException('Cet email est déjà utilisé par un autre employé.');
      }
    }

    if (organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: Number(organizationId) },
      });
      if (!org) {
        throw new NotFoundException(`L'organisation #${organizationId} est introuvable.`);
      }
    }

    const dataToUpdate: any = {};

    if (nom !== undefined) dataToUpdate.nom = nom;
    if (prenom !== undefined) dataToUpdate.prenom = prenom;
    if (email !== undefined) dataToUpdate.email = email;
    if (adress !== undefined) dataToUpdate.adress = adress;
    if (adress_en !== undefined) dataToUpdate.adress_en = adress_en;
    if (latitude !== undefined) dataToUpdate.latitude = latitude;
    if (longitude !== undefined) dataToUpdate.longitude = longitude;
    if (role !== undefined) dataToUpdate.role = role;

    if (organizationId !== undefined) {
      const targetOrgId = organizationId ? Number(organizationId) : null;

      if (targetOrgId) {
        const org = await this.prisma.organization.findUnique({
          where: { id: targetOrgId },
        });
        if (!org) {
          throw new NotFoundException(`L'organisation #${targetOrgId} est introuvable.`);
        }
      }else{
        await this.prisma.organization.updateMany({
          where: { managerId: numericId },
          data: { managerId: null },
        });
      }

      dataToUpdate.organizationId = targetOrgId;
    }

    if (password && password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    try {
      return await this.prisma.employe.update({
        where: { id: numericId },
        data: dataToUpdate,
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          role: true,
          adress: true,
          adress_en: true,
          latitude: true,
          longitude: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              nom: true,
            },
          },
          updatedAt: true,
        },
      });
    } catch (error) {
      console.error('❌ Erreur Prisma lors de la modification :', error);
      throw new BadRequestException(`Impossible de mettre à jour l'employé: ${error.message}`);
    }
  }


 async remove(id: number) {
  const numericId = Number(id);
  await this.findOne( numericId);

    await this.prisma.organization.updateMany({
      where: { managerId: numericId },
      data: { managerId: null },
    });

  return this.prisma.employe.delete({
    where: { id },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
    },
  });
}

  async findByOrganization(organizationId: number) {
    return this.prisma.employe.findMany({
      where: {
        organisationId: organisationId,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        organisationId: true,
        organisation:{
          slect:{
            id: true,
            nom:true,
          }
        }
      },
    });
  }

  async getEmployesSansPlanning(user: any) {
  return await this.prisma.employe.findMany({
    where: {
      plannings: {
        none: {},
      },
    },
  });
}

  async findSubordinatesByManager(managerId: number) {
    const managedOrg = await this.prisma.organization.findFirst({
      where: { managerId },
    });

    if (!managedOrg) {
      throw new NotFoundException(
        `Aucune organisation gérée trouvée pour l'utilisateur #${managerId}.`,
      );
    }

    const subordinates = await this.prisma.employe.findMany({
      where: {
        organization: {
          path: {
            startsWith: managedOrg.path,
          },
        },
        NOT: {
          id: managerId,
        },
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        adress: true,
        adress_en: true,
        latitude: true,
        longitude: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            nom: true,
            nom_en: true,
            path: true,
          },
        },
        plannings:true,
        createdAt: true,
      },
      orderBy: {
        nom: 'asc',
      },
    });

    return {
      managerOrganization: {
        id: managedOrg.id,
        nom: managedOrg.nom,
        nom_en: managedOrg.nom_en
      },
      total: subordinates.length,
      subordinates,
    };
  }


async calculerEtatEmploye(employeId: number, dateCible: Date = new Date()): Promise<string> {
  const startOfDay = new Date(Date.UTC(dateCible.getFullYear(), dateCible.getMonth(), dateCible.getDate(), 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(dateCible.getFullYear(), dateCible.getMonth(), dateCible.getDate(), 23, 59, 59, 999));

  const pointage = await this.prisma.pointage.findFirst({
    where: {
      employeId,
      date: { gte: startOfDay, lte: endOfDay },
    },
  });
  if (pointage) return 'PRESENT';

  const absenceValide = await this.prisma.demandeAbsence.findFirst({
    where: {
      employeId,
      status: 'VALIDE',
      dateDebut: { lte: endOfDay },
      dateFin: { gte: startOfDay },
    },
  });

  if (absenceValide) {
    const type = (absenceValide.type || '').toUpperCase();
    if (type.includes('CONGE')) return 'CONGE';
    if (type.includes('RECUP')) return 'RECUPERATION';
    return 'ABSENT_JUSTIFIE';
  }

  const planning = await this.prisma.planning.findFirst({
    where: {
      employeId,
      dateDebut: { lte: endOfDay },
      dateFin: { gte: startOfDay },
    },
  });

  if (planning?.type_travail === 'REPOS') return 'REPOS';

  if (!planning) {
    const day = dateCible.getDay();
    if (day === 5 || day === 6) return 'REPOS';
  }

  return 'ABSENT_NON_JUSTIFIE';
}
}

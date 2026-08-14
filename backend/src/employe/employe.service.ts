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

  // 1. CREATE
  async create(createEmployeDto: CreateEmployeDto) {
    // 1️⃣ Vérification de l'unicité de l'email
    const existing = await this.prisma.employe.findUnique({
      where: { email: createEmployeDto.email },
    });
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé.');
    }
    // 2️⃣ Vérification de l'existence de l'organisation (si fournie)
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

    // 3️⃣ Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(createEmployeDto.password, 10);

    // 4️⃣ Création en base de données avec le managerId résolu
    return this.prisma.employe.create({
      data: {
        nom: createEmployeDto.nom,
        prenom: createEmployeDto.prenom,
        email: createEmployeDto.email,
        password: hashedPassword,
        adress: createEmployeDto.adress,
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



  // 2. READ ALL
  async findAll() {
    return this.prisma.employe.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        adress: true,
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

  // =========================================================================
  // 3. READ ONE
  // =========================================================================
  async findOne(id: number) {
    const employe = await this.prisma.employe.findUnique({
      where: { id },
      include: {
        // 🔑 1. On charge la relation "organization" (avec un z) et non la clé "organisationId"
        organization: {
          select: {
            id: true,
            nom: true,
            typeOrganization: true,
            path: true,
          },
        },
      },
    });

    if (!employe) {
      throw new NotFoundException(`Employé avec l'ID ${id} introuvable.`);
    }

    // Retirer le mot de passe de l'objet retourné par sécurité
    const { password, ...result } = employe;
    return result;
  }

  // 4. FIND BY EMAIL (Usage interne pour l'Auth) - Indispensable
  async findByEmail(email: string) {
    return this.prisma.employe.findUnique({
      where: { email },
    });
  }

// =========================================================================
  // 5. UPDATE (Corrigé pour Prisma)
  // =========================================================================
  async update(id: number | string, updateEmployeDto: UpdateEmployeDto) {
    // 1️⃣ Convertir l'ID en entier pour Prisma
    const numericId = Number(id);

    if (isNaN(numericId)) {
      throw new BadRequestException("L'ID fourni est invalide.");
    }

    // 2️⃣ Vérification de l'existence de l'employé
    await this.findOne(numericId);

    const { nom, prenom, email, password, adress, role, organizationId } = updateEmployeDto;

    // 3️⃣ Vérification unicité email
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

    // 4️⃣ Vérification existence de l'organisation
    if (organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: Number(organizationId) },
      });
      if (!org) {
        throw new NotFoundException(`L'organisation #${organizationId} est introuvable.`);
      }
    }

    // 5️⃣ Construction de l'objet de mise à jour pour Prisma
    const dataToUpdate: any = {};

    if (nom !== undefined) dataToUpdate.nom = nom;
    if (prenom !== undefined) dataToUpdate.prenom = prenom;
    if (email !== undefined) dataToUpdate.email = email;
    if (adress !== undefined) dataToUpdate.adress = adress;
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
        // 🟢 FIX : Si on le détache d'organisation (targetOrgId === null),
        // on retire automatiquement son rôle de manager sur toute organisation qu'il gérait !
        await this.prisma.organization.updateMany({
          where: { managerId: numericId },
          data: { managerId: null },
        });
      }

      dataToUpdate.organizationId = targetOrgId; // 👈 Avec un 'z' !
    }

    // Hachage mot de passe si fourni
    if (password && password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

   // 4️⃣ Exécution de l'update avec try/catch pour capturer les erreurs Prisma
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


 // 6. DELETE (Sécurisé)
async remove(id: number) {
  // 1️⃣ Vérifier si l'employé existe
  const numericId = Number(id);
  await this.findOne( numericId);

 // 🟢 FIX : Si cet employé est manager d'une organisation, 
    // on libère l'organisation (managerId = null) avant de supprimer l'employé
    await this.prisma.organization.updateMany({
      where: { managerId: numericId },
      data: { managerId: null },
    });

  // 3️⃣ Suppression si tout est vert
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
      // 🟢 MAGIE PRISMA : Récupère uniquement les employés qui n'ont AUCUN planning rattaché !
      plannings: {
        none: {},
      },
      // Vos filtres habituels de rôle / manager ici...
    },
  });
}

 // =========================================================================
  // READ SUBORDINATES (Pour l'espace Manager)
  // =========================================================================
  async findSubordinatesByManager(managerId: number) {
    // 1️⃣ Trouver l'organisation gérée par ce manager
    const managedOrg = await this.prisma.organization.findFirst({
      where: { managerId },
    });

    if (!managedOrg) {
      throw new NotFoundException(
        `Aucune organisation gérée trouvée pour l'utilisateur #${managerId}.`,
      );
    }

    // 2️⃣ Récupérer tous les employés de la sous-arborescence (via le path)
    const subordinates = await this.prisma.employe.findMany({
      where: {
        organization: {
          path: {
            startsWith: managedOrg.path, // 🔑 Magie du Materialized Path : attrape toute la branche !
          },
        },
        NOT: {
          id: managerId, // Exclut le manager lui-même de la liste de ses subordonnés
        },
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        adress: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            nom: true,
            path: true, // Très utile pour reconstruire le chemin complet dans Angular
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
        nom: managedOrg.nom
      },
      total: subordinates.length,
      subordinates,
    };
  }

  // À ajouter à l'intérieur de la classe EmployeService dans employe.service.ts

// =========================================================================
// 🔑 CALCUL DYNAMIQUE DE L'ÉTAT D'UN EMPLOYÉ SUR UNE DATE DONNÉE
// =========================================================================
async calculerEtatEmploye(employeId: number, dateCible: Date = new Date()): Promise<string> {
  const startOfDay = new Date(Date.UTC(dateCible.getFullYear(), dateCible.getMonth(), dateCible.getDate(), 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(dateCible.getFullYear(), dateCible.getMonth(), dateCible.getDate(), 23, 59, 59, 999));

  // 1. A-t-il un pointage enregistré ?
  const pointage = await this.prisma.pointage.findFirst({
    where: {
      employeId,
      date: { gte: startOfDay, lte: endOfDay },
    },
  });
  if (pointage) return 'PRESENT';

  // 2. A-t-il un congé / récupération / absence validé ?
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

  // 3. Planning ou jour de repos ?
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
    if (day === 5 || day === 6) return 'REPOS'; // Vendredi / Samedi
  }

  // 4. Sinon, il était prévu mais sans pointage ni justificatif
  return 'ABSENT_NON_JUSTIFIE';
}
}

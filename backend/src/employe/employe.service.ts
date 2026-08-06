// employe.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
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

    // 2️⃣ Recherche automatique du Manager du service si managerId est absent
    let finalManagerId = createEmployeDto.managerId;

    if (!finalManagerId && createEmployeDto.serviceId) {
      const managerDuService = await this.prisma.employe.findFirst({
        where: {
          serviceId: createEmployeDto.serviceId,
          role: 'MANAGER', // 🔑 on cherche le manager du service
        },
      });

      if (!managerDuService) {
        throw new NotFoundException(
          `Aucun manager trouvé pour le service #${createEmployeDto.serviceId}.`
        );
      }

      finalManagerId = managerDuService.id;
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
        serviceId: createEmployeDto.serviceId,
        managerId: finalManagerId, // 👈 auto-attribué
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        adress: true,
        serviceId: true,
        managerId: true,
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
        service: { select: { id: true, nom_service: true } },
        manager: { select: { id: true, nom: true, prenom: true } },
        createdAt: true,
      },
    });
  }

  // 3. READ ONE
  async findOne(id: number) {
    const employe = await this.prisma.employe.findUnique({
      where: { id },
      include: {
        service: true,
        manager: true,
        subordonnes: true,
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

  // 5. UPDATE
  async update(id: number, updateEmployeDto: UpdateEmployeDto) {
    await this.findOne(id); // Vérifie d'abord si l'employé existe

    // Si le mot de passe est modifié, on le re-hache
    if (updateEmployeDto.password) {
      updateEmployeDto.password = await bcrypt.hash(updateEmployeDto.password, 10);
    }

    return this.prisma.employe.update({
      where: { id },
      data: updateEmployeDto,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  // 6. DELETE
  async remove(id: number) {
    await this.findOne(id); // Vérifie s'il existe

    await this.prisma.employe.delete({
      where: { id },
    });

    return { message: `L'employé avec l'ID ${id} a été supprimé avec succès.` };
  }

  async findByService(serviceId: number) {
    return this.prisma.employe.findMany({
      where: {
        serviceId: serviceId,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        serviceId: true,
        // Tu peux sélectionner uniquement les champs nécessaires pour le front
      },
    });
  }

  // Récupère l'équipe globale du manager (Smart Scope : Service + Direction complète)
async findEquipeDuManager(managerId: number) {
  // 1. Charger le profil du manager avec la Direction et les Services qu'il gère
  const manager = await this.prisma.employe.findUnique({
    where: { id: managerId },
    include: {
      directionGeree: {
        include: {
          services: { select: { id: true } }, // Les IDs de tous les services de sa Direction
        },
      },
      servicesGeres: { select: { id: true } }, // Les IDs des services qu'il gère directement
    },
  });

  if (!manager) {
    throw new NotFoundException(`Manager avec l'ID ${managerId} introuvable.`);
  }

  // 2. Construire la liste de TOUS les IDs de services sous sa responsabilité
  const serviceIdsSet = new Set<number>();

  // A. Son propre service de rattachement
  if (manager.serviceId) {
    serviceIdsSet.add(manager.serviceId);
  }

  // B. Les services qu'il gère en tant que Manager de Service
  manager.servicesGeres.forEach((s) => serviceIdsSet.add(s.id));

  // C. 🔑 S'il est Directeur : Ajouter TOUS les services de sa Direction
  if (manager.directionGeree) {
    manager.directionGeree.services.forEach((s) => serviceIdsSet.add(s.id));
  }

  const serviceIds = Array.from(serviceIdsSet);

  // 3. Récupérer l'ensemble des employés correspondant au périmètre
  return this.prisma.employe.findMany({
    where: {
      OR: [
        // Condition 1 : Subordonnés directs (managerId === manager.id)
        { managerId: managerId },

        // Condition 2 : Appartiennent à l'un des services du périmètre
        ...(serviceIds.length > 0 ? [{ serviceId: { in: serviceIds } }] : []),
      ],
      // Exclure le manager lui-même de la liste de son équipe
      NOT: { id: managerId },
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      serviceId: true,
      managerId: true,
      service: {
        select: {
          id: true,
          nom_service: true,
          direction: { select: { id: true, nom_direction: true } },
        },
      },
      compteur: true, // Pour consulter leurs soldes dans le dashboard
    },
    orderBy: { nom: 'asc' },
  });
}

// Récupère la vue d'ensemble complète du Manager (Direction, Services et Équipe)
async getManagerDashboard(managerId: number) {
  // 1. Récupérer les informations du Manager et ce qu'il gère
  const manager = await this.prisma.employe.findUnique({
    where: { id: managerId },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,

      // A. Son service de travail actuel
      service: {
        select: {
          id: true,
          nom_service: true,
          direction: { select: { id: true, nom_direction: true } },
        },
      },

      // B. La Direction qu'il gère (si c'est un Directeur)
      directionGeree: {
        select: {
          id: true,
          nom_direction: true,
          services: {
            select: {
              id: true,
              nom_service: true,
              _count: { select: { employes: true } },
            },
          },
        },
      },

      // C. Le/Les Services qu'il gère (si c'est un Chef de service)
      servicesGeres: {
        select: {
          id: true,
          nom_service: true,
          direction: { select: { id: true, nom_direction: true } },
          _count: { select: { employes: true } },
        },
      },
    },
  });

  if (!manager) {
    throw new NotFoundException(`Manager avec l'ID ${managerId} introuvable.`);
  }

  // 2. Récupérer toute son équipe (grâce à la méthode intelligente qu'on a créée)
  const equipe = await this.findEquipeDuManager(managerId);

  // 3. Retourner un objet complet pour le Front-end
  return {
    profile: {
      id: manager.id,
      nom: manager.nom,
      prenom: manager.prenom,
      email: manager.email,
      role: manager.role,
      serviceActuel: manager.service,
    },
    supervision: {
      isDirecteur: !!manager.directionGeree,
      directionGeree: manager.directionGeree || null,
      servicesGeres: manager.servicesGeres,
    },
    statistiques: {
      totalEmployesSupervises: equipe.length,
    },
    equipe, // La liste de tous ses employés
  };
}
  // Récupère uniquement les Managers qui ne gèrent ENCORE AUCUNE Direction
  async findAvailableDirectionManagers() {
    return this.prisma.employe.findMany({
      where: {
        role: Role.MANAGER,
        directionGeree: null, // 🔑 Aucun raccordement à une direction pour l'instant
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        service: { select: { nom_service: true } },
      },
      orderBy: { nom: 'asc' },
    });
  }

  // Récupère uniquement les Managers qui ne gèrent ENCORE AUCUN SERVICE
async findAvailableServiceManagers() {
  return this.prisma.employe.findMany({
    where: {
      role: Role.MANAGER,
      servicesGeres: {
        none: {}, // 🔑 N'est responsable d'AUCUN service pour le moment
      },
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
    },
    orderBy: { nom: 'asc' },
  });
}
}

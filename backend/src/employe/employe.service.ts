import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { UpdateEmployeDto } from './dto/update-employe.dto';
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class EmployeService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. CREATE
 async create(createEmployeDto: CreateEmployeDto) {
  // 1. Vérification de l'unicité de l'email
  const existing = await this.prisma.employe.findUnique({
    where: { email: createEmployeDto.email },
  });

  if (existing) {
    throw new ConflictException('Cet email est déjà utilisé.');
  }

  // 2. 🎯 Recherche automatique du Manager du service si managerId est absent
  let finalManagerId = createEmployeDto.managerId;

  if (!finalManagerId && createEmployeDto.serviceId) {
    const managerDuService = await this.prisma.employe.findFirst({
      where: {
        serviceId: createEmployeDto.serviceId,
        role: 'MANAGER', // On cherche le manager du service
      },
    });

    if (managerDuService) {
      finalManagerId = managerDuService.id;
    }
  }

  // 3. Hachage du mot de passe
  const hashedPassword = await bcrypt.hash(createEmployeDto.password, 10);

  // 4. Création en base de données avec le managerId résolu
  return this.prisma.employe.create({
    data: {
      ...createEmployeDto,
      password: hashedPassword,
      managerId: finalManagerId, // 👈 Affectation automatique de l'ID du manager
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

  async findEquipeDuManager(managerId: number, serviceId?: number) {
  return this.prisma.employe.findMany({
    where: {
      OR: [
        { managerId: managerId }, // Tous les subordonnés directs
        { serviceId: serviceId && serviceId > 0 ? serviceId : undefined }, // Tous les membres du même service
      ],
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      managerId: true,
      service: {
        select: { id: true, nom_service: true },
      },
    },
    orderBy: { nom: 'asc' },
  });
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


}

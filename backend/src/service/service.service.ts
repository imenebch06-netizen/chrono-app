import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // CRÉATION
  async create(createServiceDto: CreateServiceDto) {
  // A. Vérification de l'existence de la direction
  const direction = await this.prisma.direction.findUnique({
    where: { id: createServiceDto.directionId },
  });

  if (!direction) {
    throw new NotFoundException(
      `La direction avec l'ID ${createServiceDto.directionId} n'existe pas.`,
    );
  }

  // B. Vérification du manager
  if (createServiceDto.managerId) {
    const manager = await this.prisma.utilisateur.findUnique({
      where: { id: createServiceDto.managerId },
      select: { id: true, role: true },
    });

    if (!manager) {
      throw new NotFoundException("Manager introuvable.");
    }

    if (manager.role !== 'MANAGER') {
      throw new BadRequestException("L'utilisateur fourni n'est pas un manager.");
    }

    // C. Vérification : Le manager supervise-t-il déjà un autre service ?
    const isAlreadyManagingService = await this.prisma.service.findFirst({
      where: { managerId: createServiceDto.managerId },
    });

    if (isAlreadyManagingService) {
      throw new BadRequestException("Ce manager supervise déjà un autre service.");
    }
  }

  // D. Création du service
  return this.prisma.service.create({
    data: createServiceDto,
    include: {
      direction: true,
      manager: {
        select: { id: true, nom: true, prenom: true, email: true },
      },
    },
  });
}


  // LECTURE TOUS
  async findAll() {
    return this.prisma.service.findMany({
      include: {
        direction: true,
        _count: { select: { employes: true } }, // Nombre d'employés dans le service
      },
    });
  }

  // LECTURE UN SEUL
  async findOne(id: number) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        direction: true,
        manager: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        employes: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service avec l'ID ${id} introuvable.`);
    }

    return service;
  }

  // MISE À JOUR
  async update(id: number, updateServiceDto: UpdateServiceDto) {
    // S'assurer que le service existe
    await this.findOne(id);

    // Si on modifie ou qu'on attribue un managerId
    if (updateServiceDto.managerId) {
      const isAlreadyManagingService = await this.prisma.service.findFirst({
        where: {
          managerId: updateServiceDto.managerId,
          NOT: { id: id }, // Exclure le service actuel
        },
      });

      if (isAlreadyManagingService) {
        throw new BadRequestException('Ce manager supervise déjà un autre service.');
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
      include: {
        direction: true,
        manager: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });
  }

  // SUPPRESSION
  async remove(id: number) {
    await this.findOne(id); // S'assure que le service existe

    return this.prisma.service.delete({
      where: { id },
    });
  }
}

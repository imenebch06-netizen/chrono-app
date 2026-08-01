import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // CRÉATION
  async create(createServiceDto: CreateServiceDto) {
    // Vérification de l'existence de la direction
    const direction = await this.prisma.direction.findUnique({
      where: { id: createServiceDto.directionId },
    });

    if (!direction) {
      throw new NotFoundException(
        `La direction avec l'ID ${createServiceDto.directionId} n'existe pas.`,
      );
    }

    return this.prisma.service.create({
      data: createServiceDto,
      include: { direction: true },
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
    await this.findOne(id); // S'assure que le service existe

    if (updateServiceDto.directionId) {
      const direction = await this.prisma.direction.findUnique({
        where: { id: updateServiceDto.directionId },
      });
      if (!direction) {
        throw new NotFoundException(
          `La direction avec l'ID ${updateServiceDto.directionId} n'existe pas.`,
        );
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
      include: { direction: true },
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

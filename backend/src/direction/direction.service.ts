import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDirectionDto } from './dto/create-direction.dto';
import { UpdateDirectionDto } from './dto/update-direction.dto';

@Injectable()
export class DirectionsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. CRÉATION
  async create(createDirectionDto: CreateDirectionDto) {
    // Si un managerId est fourni à la création, on vérifie qu'il n'est pas déjà pris
    if (createDirectionDto.managerId) {
      const isAlreadyManaging = await this.prisma.direction.findUnique({
        where: { managerId: createDirectionDto.managerId },
      });

      if (isAlreadyManaging) {
        throw new BadRequestException('Ce manager supervise déjà une autre direction.');
      }
    }

    return this.prisma.direction.create({
      data: createDirectionDto,
      include: {
        manager: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });
  }

  // 2. LECTURE DE TOUTES LES DIRECTIONS
  async findAll() {
    return this.prisma.direction.findMany({
      include: {
        manager: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        _count: {
          select: { services: true },
        },
      },
    });
  }

  // 3. LECTURE D'UNE SEULE DIRECTION
  async findOne(id: number) {
    const direction = await this.prisma.direction.findUnique({
      where: { id },
      include: {
        manager: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        services: true,
      },
    });

    if (!direction) {
      throw new NotFoundException(`Direction avec l'ID ${id} introuvable.`);
    }

    return direction;
  }

  // 4. MISE À JOUR
  async update(id: number, updateDirectionDto: UpdateDirectionDto) {
    await this.findOne(id); // S'assure que la direction existe

    // Si on modifie ou qu'on attribue un managerId
    if (updateDirectionDto.managerId) {
      const isAlreadyManaging = await this.prisma.direction.findUnique({
        where: { managerId: updateDirectionDto.managerId },
      });

      // Si le manager gère DÉJÀ une direction ET que ce n'est pas la direction actuelle
      if (isAlreadyManaging && isAlreadyManaging.id !== id) {
        throw new BadRequestException('Ce manager supervise déjà une autre direction.');
      }
    }

    return this.prisma.direction.update({
      where: { id },
      data: updateDirectionDto,
      include: {
        manager: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });
  }

  // 5. SUPPRESSION
  async remove(id: number) {
    await this.findOne(id); // S'assure que la direction existe

    return this.prisma.direction.delete({
      where: { id },
    });
  }
}

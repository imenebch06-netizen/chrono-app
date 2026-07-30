import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDirectionDto } from './dto/create-direction.dto';
import { UpdateDirectionDto } from './dto/update-direction.dto';

@Injectable()
export class DirectionsService {
  constructor(private readonly prisma: PrismaService) {}

  // CRÉATION
  async create(createDirectionDto: CreateDirectionDto) {
    return this.prisma.direction.create({
      data: createDirectionDto,
    });
  }

  // LECTURE TOUTES
  async findAll() {
    return this.prisma.direction.findMany({
      include: {
        _count: {
          select: { services: true }, // Compte le nombre de services rattachés
        },
      },
    });
  }

  // LECTURE UNE SEULE
  async findOne(id: number) {
    const direction = await this.prisma.direction.findUnique({
      where: { id },
      include: {
        services: true, // Inclut la liste des services de cette direction
      },
    });

    if (!direction) {
      throw new NotFoundException(`Direction avec l'ID ${id} introuvable.`);
    }

    return direction;
  }

  // MISE À JOUR
  async update(id: number, updateDirectionDto: UpdateDirectionDto) {
    await this.findOne(id); // S'assure que la direction existe

    return this.prisma.direction.update({
      where: { id },
      data: updateDirectionDto,
    });
  }

  // SUPPRESSION
  async remove(id: number) {
    await this.findOne(id); // S'assure que la direction existe

    return this.prisma.direction.delete({
      where: { id },
    });
  }
}
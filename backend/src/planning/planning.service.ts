import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanningDto } from './dto/create-planning.dto';

@Injectable()
export class PlanningService {
  constructor(private readonly prisma: PrismaService) {}

  // Attribuer un planning à un employé
  async create(dto: CreatePlanningDto) {
    const employe = await this.prisma.employe.findUnique({
      where: { id: dto.employeId },
    });
    if (!employe) {
      throw new NotFoundException(`L'employé avec l'ID ${dto.employeId} n'existe pas.`);
    }
    const { joursRepos } = dto;

    // 🔄 Conversion : Si c'est un tableau [5, 6], on le transforme en "5,6"
    let joursReposString = '5,6'; // Valeur par défaut si non fourni

    if (Array.isArray(joursRepos)) {
      joursReposString = joursRepos.join(',');
    } else if (typeof joursRepos === 'string') {
      joursReposString = joursRepos;
    }

    return this.prisma.planning.create({
      data: {
        employeId: dto.employeId,
        dateDebut: new Date(dto.dateDebut),
        dateFin: new Date(dto.dateFin),
        joursRepos: joursReposString,
        heureDebut: dto.heureDebut,
        heureFin: dto.heureFin,
        type_travail: dto.type_travail,
      },
    });
  }

  // Récupérer tous les plannings rattachés à un employé
  async findByEmploye(employeId: number) {
    return this.prisma.planning.findMany({
      where: { employeId },
      orderBy: { dateDebut: 'desc' },
    });
  }
  async delete(id: number) {
    const planning = await this.prisma.planning.findUnique({ where: { id } });
    if (!planning) {
      throw new NotFoundException(`Planning avec l'ID ${id} introuvable.`);
    }

    return this.prisma.planning.delete({ where: { id } });
  }
}

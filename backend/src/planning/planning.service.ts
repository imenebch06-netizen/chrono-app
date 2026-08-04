import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanningDto } from './dto/create-planning.dto';

@Injectable()
export class PlanningService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Attribuer un planning à un employé (Normal, 3x8, Flexible ou Repos)
  async create(dto: CreatePlanningDto) {
    // Vérifier l'existence de l'employé
    const employe = await this.prisma.employe.findUnique({
      where: { id: dto.employeId },
    });
    if (!employe) {
      throw new NotFoundException(
        `L'employé avec l'ID ${dto.employeId} n'existe pas.`,
      );
    }

    // 🔄 Conversion : Jours de repos en format chaîne ("5,6")
    let joursReposString = '5,6'; // Par défaut Vendredi, Samedi

    if (Array.isArray(dto.joursRepos)) {
      joursReposString = dto.joursRepos.join(',');
    } else if (typeof dto.joursRepos === 'string') {
      joursReposString = dto.joursRepos;
    }

    // Enregistrement avec la totalité des champs (Horaires classiques + Shifts 3x8 + Plages fixes)
    return this.prisma.planning.create({
      data: {
        employeId: dto.employeId,
        dateDebut: new Date(dto.dateDebut),
        dateFin: new Date(dto.dateFin),
        type_travail: dto.type_travail,
        heureDebut: dto.heureDebut ?? '',
        heureFin: dto.heureFin ?? '',
        typeShift: dto.typeShift,           // Ex: 'MATIN', 'SOIR', 'NUIT'
        plageFixeDebut: dto.plageFixeDebut ?? '', // Ex: '09:30' (Pour horaires flexibles)
        plageFixeFin: dto.plageFixeFin ?? '',     // Ex: '15:30' (Pour horaires flexibles)
        joursRepos: joursReposString,
      },
    });
  }

  // 2. Récupérer tous les plannings d'un employé
  async findByEmploye(employeId: number) {
    return this.prisma.planning.findMany({
      where: { employeId },
      orderBy: { dateDebut: 'desc' },
    });
  }

  // 3. Supprimer un planning
  async delete(id: number) {
    const planning = await this.prisma.planning.findUnique({ where: { id } });
    if (!planning) {
      throw new NotFoundException(`Planning avec l'ID ${id} introuvable.`);
    }

    return this.prisma.planning.delete({ where: { id } });
  }

  // 4. Récupérer les plannings par Service (avec filtre de dates optionnel)
  async findByService(serviceId: number, dateDebut?: string, dateFin?: string) {
    return this.prisma.planning.findMany({
      where: {
        employe: {
          serviceId: serviceId,
        },
        ...(dateDebut &&
          dateFin && {
            dateDebut: { lte: new Date(dateFin) },
            dateFin: { gte: new Date(dateDebut) },
          }),
      },
      include: {
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: { dateDebut: 'desc' },
    });
  }
}
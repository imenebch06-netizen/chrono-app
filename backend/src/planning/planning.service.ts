import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanningDto } from './dto/create-planning.dto';

@Injectable()
export class PlanningService {
  [x: string]: any;
  constructor(private readonly prisma: PrismaService) {}

  // 1. Attribuer un planning à un employé (Normal, 3x8, Flexible ou Repos)
  // 1. Attribuer un planning à un employé ou une liste
// 1. Attribuer un planning à un employé ou une liste
async createPlanning(dto: CreatePlanningDto, currentUser: any) {
  // 🔄 Conversion : Jours de repos en format chaîne
  let joursReposString = '5,6'; // par défaut samedi/dimanche
  if (Array.isArray(dto.joursRepos)) {
    joursReposString = dto.joursRepos.join(',');
  } else if (typeof dto.joursRepos === 'string') {
    joursReposString = dto.joursRepos;
  }

  // ✅ Déterminer la liste des employés (un seul ou plusieurs)
  const employeIds = dto.employeId ? [dto.employeId] : dto.employeIds ?? [];
  if (employeIds.length === 0) {
    throw new BadRequestException('Aucun employé spécifié.');
  }

  // 🔒 Vérification du périmètre si c’est un manager
  if (currentUser.role === 'MANAGER') {
    // 1. Employés de son service
    const employesService = await this.prisma.employe.findMany({
      where: { serviceId: currentUser.serviceId },
      select: { id: true },
    });

    // 2. Autres managers
    const managers = await this.prisma.employe.findMany({
      where: { role: 'MANAGER' },
      select: { id: true },
    });

    const allowedIds = [...employesService.map(e => e.id), ...managers.map(m => m.id)];

    // 3. Filtrer
    const invalidIds = employeIds.filter(id => !allowedIds.includes(id));
    if (invalidIds.length > 0) {
      throw new ForbiddenException(
        `Vous n'avez pas le droit d'attribuer un planning à ces employés: ${invalidIds.join(', ')}`
      );
    }
  }

  // ✅ Vérifier que ces employés n’ont pas déjà un planning sur la période
  const existingPlannings = await this.prisma.planning.findMany({
    where: {
      employeId: { in: employeIds },
      OR: [
        { dateDebut: { lte: new Date(dto.dateFin) }, dateFin: { gte: new Date(dto.dateDebut) } },
      ],
    },
  });

  const employesAvecPlanning = new Set(existingPlannings.map(p => p.employeId));
  const employesSansPlanning = employeIds.filter(id => !employesAvecPlanning.has(id));

  if (employesSansPlanning.length === 0) {
    throw new BadRequestException('Tous les employés ont déjà un planning sur cette période.');
  }

  // ✅ Générer les jours de la période en excluant week-ends
  const jours: Date[] = [];
  const debut = new Date(dto.dateDebut);
  const fin = new Date(dto.dateFin);
  for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) {
    const day = d.getDay(); // 0 = dimanche, 6 = samedi
    if (day !== 0 && day !== 6) {
      jours.push(new Date(d));
    }
  }

  // ✅ Construire les données pour chaque employé et chaque jour
  const data = employesSansPlanning.flatMap(employeId =>
    jours.map(jour => ({
      employeId,
      dateDebut: jour,
      dateFin: jour,
      type_travail: dto.type_travail,
      heureDebut: dto.heureDebut ?? '',
      heureFin: dto.heureFin ?? '',
      typeShift: dto.typeShift,
      plageFixeDebut: dto.plageFixeDebut ?? '',
      plageFixeFin: dto.plageFixeFin ?? '',
      joursRepos: joursReposString,
    }))
  );

  // ✅ Insertion groupée
  return this.prisma.planning.createMany({ data });
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

  async getPlanningsPerimetreManager(managerId: number) {
  // 1. Récupérer la liste des employés supervisés par ce manager
  const equipe = await this.employe.findEquipeDuManager(managerId);
  const employeIds = equipe.map((emp: { id: any; }) => emp.id);

  if (employeIds.length === 0) {
    throw new NotFoundException(`Aucun employé rattaché à ce manager.`);
  }

  // 2. Récupérer tous leurs plannings
  return this.prisma.planning.findMany({
    where: { employeId: { in: employeIds } },
    include: {
      employe: { select: { id: true, nom: true, prenom: true, service: true } },
    },
  });
}

}

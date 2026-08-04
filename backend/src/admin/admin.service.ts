import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getGlobalStats(dateParam?: string) {
    // 1. Définition de la date cible à analyser
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();

    const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

    // Jour de la semaine (0 = Dimanche, 1 = Lundi, ..., 5 = Vendredi, 6 = Samedi)
    const jourSemaine = new Date(year, month, day, 12, 0, 0).getDay();

    // 2. Chargement de TOUS les employés et de leurs données du jour
    const [employes, pointagesDuJour, demandesValidesAujourdhui, planningsAujourdhui, demandesEnAttenteTotal] = await Promise.all([
      this.prisma.employe.findMany({ select: { id: true } }),

      this.prisma.pointage.findMany({
        where: { date: { gte: startOfDay, lte: endOfDay } },
      }),

      this.prisma.demandeAbsence.findMany({
        where: {
          status: 'VALIDE',
          dateDebut: { lte: endOfDay },
          dateFin: { gte: startOfDay },
        },
      }),

      this.prisma.planning.findMany({
        where: {
          dateDebut: { lte: endOfDay },
          dateFin: { gte: startOfDay },
        },
      }),

      this.prisma.demandeAbsence.count({
        where: { status: 'EN_ATTENTE' },
      }),
    ]);

    const totalEmployes = employes.length;

    // 3. Compteurs de statut
    let presentsCount = 0;
    let congesCount = 0;
    let recupCount = 0;
    let reposCount = 0;
    let absentsCount = 0;

    // 4. ÉVALUATION DE L'ÉTAT INDIVIDUEL DE CHAQUE EMPLOYÉ
    for (const emp of employes) {
      const pointage = pointagesDuJour.find((p) => p.employeId === emp.id);
      const absence = demandesValidesAujourdhui.find((a) => a.employeId === emp.id);
      const planning = planningsAujourdhui.find((p) => p.employeId === emp.id);

      // ÉTAPE 1 : A-t-il pointé ?
      if (pointage) {
        presentsCount++;
        continue;
      }

      // ÉTAPE 2 : A-t-il un congé / une récupération validé(e) ?
      if (absence) {
        const typeAbs = String(absence.typeDemande || '').toUpperCase();
        if (typeAbs === 'RECUPERATION' || typeAbs === 'RTT') {
          recupCount++;
        } else {
          congesCount++;
        }
        continue;
      }

      // ÉTAPE 3 : Est-ce un jour de REPOS dédié à cet employé ?
      // - Soit son planning indique type_travail = 'REPOS'
      // - Soit le jour actuel fait partie de ses `joursRepos` (ex: [5, 6])
      const joursReposEmp = planning
        ? (Array.isArray((planning as any).joursRepos)
            ? (planning as any).joursRepos
            : typeof (planning as any).joursRepos === 'string'
              ? (planning as any).joursRepos.split(',').map(Number)
              : [5, 6])
        : [5, 6]; // jours de repos par défaut si pas de planning spécifique

      const estEnRepos = planning?.type_travail === 'REPOS' || joursReposEmp.includes(jourSemaine);

      if (estEnRepos) {
        reposCount++;
        continue;
      }

      // ÉTAPE 4 : Ni présent, ni congé, ni repos -> Vraie ABSENCE INJUSTIFIÉE
      absentsCount++;
    }

    // 5. Calcul des pourcentages
    const calcPercent = (count: number) =>
      totalEmployes > 0 ? Number(((count / totalEmployes) * 100).toFixed(1)) : 0;

    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return {
      date: formattedDate,
      totalEmployes,
      repartition: {
        presents: { count: presentsCount, pourcentage: calcPercent(presentsCount) },
        conges: { count: congesCount, pourcentage: calcPercent(congesCount) },
        repos: { count: reposCount, pourcentage: calcPercent(reposCount) },
        recup: { count: recupCount, pourcentage: calcPercent(recupCount) },
        absents: { count: absentsCount, pourcentage: calcPercent(absentsCount) },
      },
      demandesEnAttenteTotal,
    };
  }
}
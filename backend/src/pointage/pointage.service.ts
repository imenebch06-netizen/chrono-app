import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';
import { CompteurService } from 'src/compteur/compteur.service';

@Injectable()
export class PointageService {
  constructor(private readonly prisma: PrismaService,
              private readonly compteurService: CompteurService,
  ) {}

  // =========================================================================
  // 1. IMPORTATION EXCEL (AVEC TOUS LES CALCULS & COMPTEURS)
  // =========================================================================
  async importerPointagesDepuisExcel(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });

    const employesExistants = await this.prisma.employe.findMany({
      select: { id: true },
    });
    const idsValides = new Set(employesExistants.map((e) => e.id));

    const resultats: any[] = [];

    for (const row of rows as any[]) {
      const { employeId, date, heureDebut, heureFin } = row;

      if (!employeId || !date || !heureDebut) continue;

      const empId = Number(employeId);
      // 🛡️ VÉRIFICATION : Bloque proprement si l'employé n'existe pas
      if (!idsValides.has(empId)) {
        throw new BadRequestException(
          `L'employé avec l'ID #${empId} indiqué dans le fichier Excel n'existe pas en base de données.`,
        );
      }
      const datePointage = this.parseDateOnly(date);
      if (!datePointage) continue;
      const start = this.parseDateTime(date, heureDebut);
      const end = heureFin ? this.parseDateTime(date, heureFin) : null;

      if (!start) continue;

      let dureeHeures: number | null = null;
      let creditDebitJour: number | null = null;

      if (end && !isNaN(end.getTime())) {
        const dureeBrute = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        // A. Chevauchement avec absences/récupérations validées
        const absencesValides = await this.prisma.demandeAbsence.findMany({
          where: {
            employeId: empId,
            status: 'VALIDE',
            dateDebut: { lte: end },
            dateFin: { gte: start },
          },
        });

        let heuresChevauchement = 0;
        let heuresAbsenceTotal = 0;

        for (const abs of absencesValides) {
          const startAbs = new Date(abs.dateDebut);
          const endAbs = new Date(abs.dateFin);

          const dureeAbs =
            abs.heures_a_recuperer || (endAbs.getTime() - startAbs.getTime()) / (1000 * 60 * 60);
          heuresAbsenceTotal += dureeAbs;

          const overlapStart = new Date(Math.max(start.getTime(), startAbs.getTime()));
          const overlapEnd = new Date(Math.min(end.getTime(), endAbs.getTime()));

          if (overlapStart < overlapEnd) {
            heuresChevauchement +=
              (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
          }
        }

        // B. Durée réellement travaillée
        dureeHeures = Number(Math.max(0, dureeBrute - heuresChevauchement).toFixed(2));

        // C. Durée théorique selon le planning
        const planning = await this.prisma.planning.findFirst({
          where: {
            employeId: empId,
            dateDebut: { lte: start },
            dateFin: { gte: start },
          },
        });

        let dureeTheoriqueBase = 8.0;

        if (planning) {
          if (planning.type_travail === 'REPOS') {
            dureeTheoriqueBase = 0.0;
          } else {
            const hDebutStr = planning.heureDebut ?? '08:00';
            const hFinStr = planning.heureFin ?? '16:00';
            const [hDeb, mDeb] = hDebutStr.split(':').map(Number);
            const [hFin, mFin] = hFinStr.split(':').map(Number);
            dureeTheoriqueBase = hFin + mFin / 60 - (hDeb + mDeb / 60);
          }
        } else {
          const jourSemaine = start.getDay();
          dureeTheoriqueBase = jourSemaine === 5 || jourSemaine === 6 ? 0.0 : 8.0;
        }

        // D. Calcul du crédit/débit ajusté
        const dureeTheoriqueAjustee = Math.max(0, dureeTheoriqueBase - heuresAbsenceTotal);
        creditDebitJour = Number((dureeHeures - dureeTheoriqueAjustee).toFixed(2));
      }

      // E. Sauvegarde / Mise à jour (Anti-doublons jour)
      const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0);
      const endOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59);

      const existingPointage = await this.prisma.pointage.findFirst({
        where: {
          employeId: empId,
          date: { gte: startOfDay, lte: endOfDay },
        },
      });

      let pointage;
      let diffCredit = creditDebitJour || 0;

      if (existingPointage) {
        diffCredit = (creditDebitJour || 0) - (existingPointage.creditDebit || 0);
        pointage = await this.prisma.pointage.update({
          where: { id: existingPointage.id },
          data: {
            heureDebut: start,
            heureFin: end,
            dureeHeures,
            creditDebit: creditDebitJour,
          },
        });
      } else {
        pointage = await this.prisma.pointage.create({
          data: {
            date: datePointage,
            heureDebut: start,
            heureFin: end,
            dureeHeures,
            creditDebit: creditDebitJour,
            employeId: empId,
          },
        });
      }

      // F. Mise à jour du compteur global RTT / Crédit-Débit
      if (diffCredit !== 0) {
       await this.compteurService.ajusterCreditDebit(empId, diffCredit);
      }

      resultats.push(pointage);
    }

    return {
      message: `${resultats.length} pointage(s) traité(s) avec succès.`,
      pointages: resultats,
    };
  }

  // =========================================================================
  // 2. RECUPERER LES POINTAGES D'UNE DATE PRÉCISE (POUR TOUS LES EMPLOYÉS)
  // =========================================================================
  async getPointagesParDate(dateStr: string) {
    const { startOfDay, endOfDay } = this.parseYMD(dateStr);

    const pointages = await this.prisma.pointage.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        employe: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
      orderBy: { heureDebut: 'asc' },
    });

    return {
      date: dateStr,
      total: pointages.length,
      pointages,
    };
  }

  // =========================================================================
  // 3. RECUPERER LES POINTAGES D'UN EMPLOYÉ PAR PLAGE (SEMAINE)
  // =========================================================================
  async getSemaineEmploye(employeId: number, dateDebutStr: string) {
    if (!dateDebutStr) {
      throw new BadRequestException('Le paramètre dateDebut est requis (YYYY-MM-DD).');
    }

    const debut = new Date(dateDebutStr);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 7);

    // Pointages enregistrés dans la DB sur la période
    const rawPointages = await this.prisma.pointage.findMany({
      where: { employeId, date: { gte: debut, lt: fin } },
      orderBy: { createdAt: 'desc' },
    });

    // Dédoublonnage au cas où
    const uniqueMap = new Map<string, (typeof rawPointages)[0]>();
    for (const p of rawPointages) {
      const dateKey = p.date.toISOString().split('T')[0];
      if (!uniqueMap.has(dateKey)) uniqueMap.set(dateKey, p);
    }

    let pointages = Array.from(uniqueMap.values());

    // Récupérer le planning pour détecter les jours non pointés
    const plannings = await this.prisma.planning.findMany({
      where: { employeId, dateDebut: { lte: fin }, dateFin: { gte: debut } },
    });

    // Compléter la semaine jour par jour
    for (let d = new Date(debut); d < fin; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const existe = pointages.some((p) => p.date.toISOString().split('T')[0] === dateKey);

      if (!existe) {
        const planningJour = plannings.find((pl) => d >= pl.dateDebut && d <= pl.dateFin);
        if (planningJour && planningJour.type_travail !== 'REPOS') {
          let heuresPrevues = 8.0;
          if (planningJour.heureDebut && planningJour.heureFin) {
            const [hDebut, mDebut] = planningJour.heureDebut.split(':').map(Number);
            const [hFin, mFin] = planningJour.heureFin.split(':').map(Number);
            heuresPrevues = hFin + mFin / 60 - (hDebut + mDebut / 60);
          }

          // Journée non pointée = Débit négatif des heures prévues
          pointages.push({
            id: -1,
            employeId,
            date: new Date(d),
            dureeHeures: 0,
            creditDebit: -heuresPrevues,
            createdAt: new Date(),
          } as any);
        }
      }
    }

    // Tri chronologique
    pointages.sort((a, b) => a.date.getTime() - b.date.getTime());

    const totalCreditSemaine = pointages.reduce((acc, p) => acc + (p.creditDebit || 0), 0);
    const compteur = await this.prisma.compteur.findUnique({ where: { employeId } });

    return {
      employeId,
      periode: {
        du: debut.toISOString().split('T')[0],
        au: fin.toISOString().split('T')[0],
      },
      totalCreditSemaine: Number(totalCreditSemaine.toFixed(2)),
      pointages,
      compteurGlobal: compteur ?? { solde_conges: 0.0, solde_rtt: 0.0, credit_debit: 0.0 },
    };
  }

  // =========================================================================
  // 🛠️ HELPERS PRIVÉS
  // =========================================================================

  private parseYMD(dateStr: string) {
    if (!dateStr) {
      throw new BadRequestException('Le paramètre "date" est obligatoire (YYYY-MM-DD).');
    }

    const parts = dateStr.split('T')[0].split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new BadRequestException('Format de date invalide. Utilisez YYYY-MM-DD.');
    }

    const [year, month, day] = parts;
    return {
      startOfDay: new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)),
      endOfDay: new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)),
    };
  }

  private parseDateTime(dateVal: any, timeVal: any): Date | null {
    if (!dateVal || !timeVal) return null;

    let year: number, month: number, day: number;

    if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
      year = dateVal.getFullYear();
      month = dateVal.getMonth();
      day = dateVal.getDate();
    } else {
      const dateStr = String(dateVal).trim();
      if (dateStr.includes('-')) {
        const parts = dateStr.split('T')[0].split('-').map(Number);
        if (parts.length < 3) return null;
        [year, month, day] = parts[0] > 1000 ? [parts[0], parts[1] - 1, parts[2]] : [parts[2], parts[1] - 1, parts[0]];
      } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length < 3) return null;
        [year, month, day] = parts[0].length === 4 
          ? [Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])]
          : [Number(parts[2]), Number(parts[0]) - 1, Number(parts[1])];
      } else {
        return null;
      }
    }

    if (year < 100) year += 2000;

    let hours = 0, minutes = 0;
    if (timeVal instanceof Date && !isNaN(timeVal.getTime())) {
      hours = timeVal.getHours();
      minutes = timeVal.getMinutes();
    } else {
      const timeStr = String(timeVal).trim();
      if (timeStr.includes(':')) {
        const parts = timeStr.split(':').map(Number);
        hours = parts[0] || 0;
        minutes = parts[1] || 0;
      }
    }

    const result = new Date(Date.UTC(year, month, day, hours, minutes, 0));
    return isNaN(result.getTime()) ? null : result;
  }


  private parseDateOnly(dateVal: any): Date | null {
    if (!dateVal) return null;

    let year: number, month: number, day: number;

    if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
      // Extraction des composants locaux d'Excel
      year = dateVal.getFullYear();
      month = dateVal.getMonth();
      day = dateVal.getDate();
    } else {
      const dateStr = String(dateVal).trim();
      if (dateStr.includes('-')) {
        const parts = dateStr.split('T')[0].split('-').map(Number);
        if (parts.length < 3) return null;
        [year, month, day] = parts[0] > 1000 ? [parts[0], parts[1] - 1, parts[2]] : [parts[2], parts[1] - 1, parts[0]];
      } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length < 3) return null;
        [year, month, day] = parts[0].length === 4 
          ? [Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])]
          : [Number(parts[2]), Number(parts[0]) - 1, Number(parts[1])];
      } else {
        return null;
      }
    }

    if (year < 100) year += 2000;

    // 💡 Force l'heure à 00:00:00 UTC pour la date du jour
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }

 // =========================================================================
// 🔑 HELPER PRIVÉ : Récupère les IDs de tous les employés gérés par un Chef
// =========================================================================
private async getEmployeIdsSousChef(chefId: number): Promise<number[]> {
  // 1. Trouver toutes les organisations dont cet utilisateur est le Chef
  const managedOrgs = await this.prisma.organization.findMany({
    where: { managerId: chefId },
    select: { path: true },
  });

  // 2. Extraire et filtrer strictement les 'path' non nuls (Type Guard TypeScript)
  const validPaths = managedOrgs
    .map((org) => org.path)
    .filter((path): path is string => Boolean(path));

  // Si le chef n'a aucune organisation ou aucun path valide
  if (validPaths.length === 0) {
    return [];
  }

  // 3. Récupérer les employés rattachés à la branche (avec des strings garanties)
  const subordinates = await this.prisma.employe.findMany({
    where: {
      OR: validPaths.map((path) => ({
        organization: {
          path: { startsWith: path }, // 'path' est maintenant un strict string !
        },
      })),
    },
    select: { id: true },
  });

  return subordinates.map((emp) => emp.id);
}
// =========================================================================
// 📌 POINTAGES DE L'ÉQUIPE DU CHEF POUR UNE DATE DONNÉE
// =========================================================================
async getPointagesEquipeParChef(chefId: number, dateStr: string) {
  const { startOfDay, endOfDay } = this.parseYMD(dateStr);

  // Récupération dynamique de la liste des employés de la branche
  const employeIds = await this.getEmployeIdsSousChef(chefId);

  if (employeIds.length === 0) {
    return {
      chefId,
      date: dateStr,
      total: 0,
      pointages: [],
    };
  }

  // Récupération des pointages filtrés
  const pointages = await this.prisma.pointage.findMany({
    where: {
      employeId: { in: employeIds },
      date: { gte: startOfDay, lte: endOfDay },
    },
    include: {
      employe: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          organization: { select: { id: true, nom: true } },
        },
      },
    },
    orderBy: { heureDebut: 'asc' },
  });

  return {
    chefId,
    date: dateStr,
    total: pointages.length,
    pointages,
  };
}
}

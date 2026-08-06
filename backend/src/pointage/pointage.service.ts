import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class PointageService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Importation intelligente : Empêche les doublons, exclut les créneaux de récupération
   * et ajuste le calcul des crédits/débits.
   */
  async importerPointagesDepuisExcel(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });

    const resultats: any[] = [];

    for (const row of rows as any[]) {
      const { employeId, date, heureDebut, heureFin } = row;

      if (!employeId || !date || !heureDebut) continue;

      const start = this.parseDateTime(date, heureDebut);
      const end = heureFin ? this.parseDateTime(date, heureFin) : null;

      if (!start || isNaN(start.getTime())) continue;

      let dureeHeures: number | null = null;
      let creditDebitJour: number | null = null;

      if (end && !isNaN(end.getTime())) {
        const dureeBrute = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        // 1. 🛑 RECHERCHE DES ABSENCES / RÉCUPÉRATIONS VALIDÉES (qui chevauchent le pointage)
        const absencesValides = await this.prisma.demandeAbsence.findMany({
          where: {
            employeId: Number(employeId),
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

          // Durée accordée pour l'absence/récupération
          const dureeAbs =
            abs.heures_a_recuperer || (endAbs.getTime() - startAbs.getTime()) / (1000 * 60 * 60);
          heuresAbsenceTotal += dureeAbs;

          // Calcul du chevauchement exact entre la plage pointée [start, end] et l'absence [startAbs, endAbs]
          const overlapStart = new Date(Math.max(start.getTime(), startAbs.getTime()));
          const overlapEnd = new Date(Math.min(end.getTime(), endAbs.getTime()));

          if (overlapStart < overlapEnd) {
            heuresChevauchement +=
              (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
          }
        }

        // 2. Durée réellement travaillée (brute moins les heures de récupération pointées)
        dureeHeures = Number(Math.max(0, dureeBrute - heuresChevauchement).toFixed(2));

        // 3. Recherche de la durée théorique standard (Planning ou Week-end)
        const planning = await this.prisma.planning.findFirst({
          where: {
            employeId: Number(employeId),
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

        // 4. Durée théorique due (Théorique standard moins les heures de récupération accordées)
        const dureeTheoriqueAjustee = Math.max(0, dureeTheoriqueBase - heuresAbsenceTotal);

        // 5. Solde Crédit / Débit final
        creditDebitJour = Number((dureeHeures - dureeTheoriqueAjustee).toFixed(2));
      }

      // 🛑 VÉRIFICATION ANTI-DOUBLONS : Recherche si un pointage existe déjà ce jour-là
      const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0);
      const endOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59);

      const existingPointage = await this.prisma.pointage.findFirst({
        where: {
          employeId: Number(employeId),
          date: { gte: startOfDay, lte: endOfDay },
        },
      });

      let pointage;
      let diffCredit = creditDebitJour || 0;

      if (existingPointage) {
        const oldCredit = existingPointage.creditDebit || 0;
        diffCredit = (creditDebitJour || 0) - oldCredit;

        pointage = await this.prisma.pointage.update({
          where: { id: existingPointage.id },
          data: {
            heureDebut: start,
            heureFin: end,
            dureeHeures: dureeHeures,
            creditDebit: creditDebitJour,
          },
        });
      } else {
        pointage = await this.prisma.pointage.create({
          data: {
            date: startOfDay,
            heureDebut: start,
            heureFin: end,
            dureeHeures: dureeHeures,
            creditDebit: creditDebitJour,
            employeId: Number(employeId),
          },
        });
      }

      // Mise à jour du compteur
      if (diffCredit !== 0) {
        await this.prisma.compteur.upsert({
          where: { employeId: Number(employeId) },
          update: {
            solde_rtt: { increment: diffCredit },
            credit_debit: { increment: diffCredit },
          },
          create: {
            employeId: Number(employeId),
            solde_conges: 0.0,
            solde_rtt: diffCredit,
            credit_debit: diffCredit,
          },
        });
      }

      resultats.push(pointage);
    }

    return {
      message: `${resultats.length} pointage(s) traité(s) sans doublons.`,
      pointages: resultats,
    };
  }

  /**
   * Récupère la vue calendrier / semaine d'un employé (sans doublons)
   */
async getSemaineEmploye(employeId: number, dateDebutStr: string) {
  if (!dateDebutStr) {
    throw new BadRequestException('Le paramètre dateDebut est requis.');
  }

  const debut = new Date(dateDebutStr);
  const fin = new Date(debut);
  fin.setDate(fin.getDate() + 7);

  // 1. Récupérer les pointages
  const rawPointages = await this.prisma.pointage.findMany({
    where: {
      employeId,
      date: { gte: debut, lt: fin },
    },
    orderBy: { createdAt: 'desc' },
  });

  const uniquePointagesMap = new Map<string, (typeof rawPointages)[0]>();
  for (const p of rawPointages) {
    const dateKey = p.date.toISOString().split('T')[0];
    if (!uniquePointagesMap.has(dateKey)) {
      uniquePointagesMap.set(dateKey, p);
    }
  }
  let pointages = Array.from(uniquePointagesMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  // 2. Récupérer le planning sur la période
  const plannings = await this.prisma.planning.findMany({
    where: { employeId, dateDebut: { lte: fin }, dateFin: { gte: debut } },
  });

  // 3. Générer toutes les dates de la semaine
  const joursSemaine: Date[] = [];
  for (let d = new Date(debut); d < fin; d.setDate(d.getDate() + 1)) {
    joursSemaine.push(new Date(d));
  }

  // 4. Compléter les jours sans pointage
  for (const jour of joursSemaine) {
    const dateKey = jour.toISOString().split('T')[0];
    const existe = pointages.find(p => p.date.toISOString().split('T')[0] === dateKey);

    if (!existe) {
      // Vérifier si le jour est prévu dans le planning
      const planningJour = plannings.find(pl => jour >= pl.dateDebut && jour <= pl.dateFin);
      if (planningJour) {
        // Calculer les heures prévues à partir de heureDebut et heureFin
        let heuresPrevues = 0;
        if (planningJour.heureDebut && planningJour.heureFin) {
          const [hDebut, mDebut] = planningJour.heureDebut.split(':').map(Number);
          const [hFin, mFin] = planningJour.heureFin.split(':').map(Number);
          heuresPrevues = (hFin + mFin / 60) - (hDebut + mDebut / 60);
        }
        // Ajouter un faux pointage avec débit négatif
        pointages.push({
          id: -1, // id fictif
          employeId,
          date: jour,
          creditDebit: -(heuresPrevues || 0),
          createdAt: new Date(),
        } as any);
      }
    }
  }

  // 5. Re-trier après ajout
  pointages = pointages.sort((a, b) => a.date.getTime() - b.date.getTime());

  // 6. Calcul du total
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
    compteurGlobal: compteur ?? {
      solde_conges: 0.0,
      solde_rtt: 0.0,
      credit_debit: 0.0,
    },
  };
}


  /**
   * Récupère les employés ayant pointé pour une date donnée (ex: YYYY-MM-DD)
   */
  async getEmployesByDate(dateStr: string) {
    if (!dateStr) {
      throw new BadRequestException('Le paramètre "date" est obligatoire (format YYYY-MM-DD).');
    }

    const parts = dateStr.split('T')[0].split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new BadRequestException('Format de date invalide. Utilisez YYYY-MM-DD.');
    }

    const [year, month, day] = parts;
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const pointages = await this.prisma.pointage.findMany({
      where: {
        heureDebut: {
          gte: startOfDay,
          lte: endOfDay,
        },
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
      totalEmployesPointe: pointages.length,
      pointages,
    };
  }

  /**
   * Parseur universel et dynamique de dates/heures
   */
  private parseDateTime(dateVal: any, timeVal: any): Date | null {
    if (!dateVal || !timeVal) return null;

    let year = 2026,
      month = 7,
      day = 1;

    if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
      year = dateVal.getFullYear();
      month = dateVal.getMonth();
      day = dateVal.getDate();
    } else {
      const dateStr = String(dateVal).trim();

      if (dateStr.includes('-')) {
        const parts = dateStr.split('T')[0].split('-').map(Number);
        if (parts[0] > 1000) {
          [year, month, day] = [parts[0], parts[1] - 1, parts[2]];
        } else {
          [year, month, day] = [parts[2], parts[1] - 1, parts[0]];
        }
      } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts[0].length === 4) {
          [year, month, day] = [Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])];
        } else {
          const moisExcel = Number(parts[0]);
          const jourExcel = Number(parts[1]);
          const anneeExcel = Number(parts[2]);

          [year, month, day] = [anneeExcel, moisExcel - 1, jourExcel];
        }
      }
    }

    if (year < 100) {
      year = 2000 + year;
    } else if (year >= 1900 && year < 2000) {
      year = year + 100;
    }

    let hours = 0,
      minutes = 0;
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

    const result = new Date(year, month, day, hours, minutes, 0);
    result.setFullYear(year);

    return isNaN(result.getTime()) ? null : result;
  }

  /**
   * Synthèse complète d'une journée
   */
  async getTableauDeBordJournee(dateStr: string) {
    if (!dateStr) {
      throw new BadRequestException('Le paramètre "date" est obligatoire (ex: YYYY-MM-DD).');
    }

    const parts = dateStr.split('T')[0].split('-').map(Number);
    const startOfDay = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
    const endOfDay = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);

    const targetDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    const jourSemaine = targetDate.getDay();

    const employes = await this.prisma.employe.findMany({
      select: { id: true, nom: true, prenom: true, email: true },
    });

    const pointages = await this.prisma.pointage.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });

    const absences = await this.prisma.demandeAbsence.findMany({
      where: {
        status: 'VALIDE',
        dateDebut: { lte: endOfDay },
        dateFin: { gte: startOfDay },
      },
    });

    const plannings = await this.prisma.planning.findMany({
      where: {
        dateDebut: { lte: endOfDay },
        dateFin: { gte: startOfDay },
      },
    });

    const presents: Array<(typeof employes)[number] & { pointage: (typeof pointages)[number] }> =
      [];
    const enConges: Array<(typeof employes)[number] & { absence: (typeof absences)[number] }> = [];
    const enRecuperation: Array<
      (typeof employes)[number] & { absence: (typeof absences)[number] }
    > = [];
    const autresAbsences: Array<
      (typeof employes)[number] & { absence: (typeof absences)[number] }
    > = [];
    const enRepos: Array<(typeof employes)[number] & { motif: string }> = [];
    const absentsInjustifies: Array<(typeof employes)[number]> = [];

    for (const emp of employes) {
      const pointage = pointages.find((pt) => pt.employeId === emp.id);
      const absence = absences.find((ab) => ab.employeId === emp.id);
      const planning = plannings.find((pl) => pl.employeId === emp.id);

      if (pointage) {
        presents.push({ ...emp, pointage });
      } else if (absence) {
        const typeAbsence = String(absence.typeDemande || '').toUpperCase();

        if (typeAbsence === 'RECUPERATION' || typeAbsence === 'RTT') {
          enRecuperation.push({ ...emp, absence });
        } else if (typeAbsence === 'CONGE_PAYE' || typeAbsence === 'CONGE') {
          enConges.push({ ...emp, absence });
        } else {
          autresAbsences.push({ ...emp, absence });
        }
      } else {
        const planningData = planning as any;
        const joursReposEmp =
          typeof planningData?.joursRepos === 'string'
            ? planningData.joursRepos.split(',').map(Number)
            : [5, 6];
        const estEnRepos =
          joursReposEmp.includes(jourSemaine) || planning?.type_travail === 'REPOS';

        if (estEnRepos) {
          enRepos.push({ ...emp, motif: 'Repos Hebdomadaire (Planning)' });
        } else {
          absentsInjustifies.push(emp);
        }
      }
    }

    return {
      date: dateStr,
      statistiques: {
        totalEmployes: employes.length,
        totalPresents: presents.length,
        totalConges: enConges.length,
        totalRecuperation: enRecuperation.length,
        totalAutresAbsences: autresAbsences.length,
        totalEnRepos: enRepos.length,
        totalAbsentsInjustifies: absentsInjustifies.length,
      },
      presents,
      enConges,
      enRecuperation,
      autresAbsences,
      enRepos,
      absentsInjustifies,
    };
  }

  async deleteAllPointages() {
    await this.prisma.pointage.deleteMany({});
  }
}

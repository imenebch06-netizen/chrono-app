import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class PointageService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Importation intelligente : Empêche les doublons et ajuste les crédits RTT
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
        const diffMs = end.getTime() - start.getTime();
        dureeHeures = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

        const planning = await this.prisma.planning.findFirst({
          where: {
            employeId: Number(employeId),
            dateDebut: { lte: start },
            dateFin: { gte: start },
          },
        });

        let dureeTheorique = 8.0;
        if (planning) {
          if (planning.type_travail === 'REPOS') {
            dureeTheorique = 0.0;
          } else {
            const [hDeb, mDeb] = planning.heureDebut.split(':').map(Number);
            const [hFin, mFin] = planning.heureFin.split(':').map(Number);
            dureeTheorique = (hFin + mFin / 60) - (hDeb + mDeb / 60);
          }
        } else {
          const jourSemaine = start.getDay();
          dureeTheorique = (jourSemaine === 5 || jourSemaine === 6) ? 0.0 : 8.0;
        }

        creditDebitJour = Number((dureeHeures - dureeTheorique).toFixed(2));
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
        // En cas de ré-importation : On calcule la différence avec l'ancien crédit
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
        // Nouveau pointage
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

      // Mise à jour du compteur avec la différence réelle
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
   * Récupère les pointages d'une semaine
   */
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

    // 1. Récupération des pointages dans l'intervalle de dates
    const rawPointages = await this.prisma.pointage.findMany({
      where: {
        employeId,
        date: { gte: debut, lt: fin },
      },
      orderBy: { createdAt: 'desc' }, // Récupère le plus récent en premier
    });

    // 2. Filtrage JS pour ne garder QUE le dernier pointage par jour (Anti-doublon)
    const uniquePointagesMap = new Map<string, typeof rawPointages[0]>();

    for (const p of rawPointages) {
      const dateKey = p.date.toISOString().split('T')[0];
      if (!uniquePointagesMap.has(dateKey)) {
        uniquePointagesMap.set(dateKey, p);
      }
    }

    const pointages = Array.from(uniquePointagesMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    // 3. Calcul exact du crédit semaine sans comptabiliser de doublons
    const totalCreditSemaine = pointages.reduce(
      (acc, p) => acc + (p.creditDebit || 0),
      0,
    );

   const compteur = await this.prisma.compteur.findUnique({
      where: { employeId },
    });

    // 🟢 5. RETOUR DE L'OBJET JSON COMPLET
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

  private parseDateTime(dateVal: any, timeVal: any): Date | null {
    if (!dateVal || !timeVal) return null;
    let year = 2026, month = 0, day = 1;
    const dateStr = String(dateVal).trim();

    if (dateStr.includes('-')) {
      const parts = dateStr.split('T')[0].split('-').map(Number);
      if (parts[0] > 1000) [year, month, day] = [parts[0], parts[1] - 1, parts[2]];
      else [year, month, day] = [parts[2], parts[1] - 1, parts[0]];
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts[0].length === 4) [year, month, day] = [Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])];
      else [year, month, day] = [Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])];
    }

    let hours = 0, minutes = 0;
    const timeStr = String(timeVal).trim();
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':').map(Number);
      hours = parts[0] || 0;
      minutes = parts[1] || 0;
    }

    const result = new Date(year, month, day, hours, minutes, 0);
    return isNaN(result.getTime()) ? null : result;
  }
/**
   * Synthèse complète d'une journée : Présents, Congés, Récupérations, Absences et Injustifiés
   */
  async getTableauDeBordJournee(dateStr: string) {
    if (!dateStr) {
      throw new BadRequestException('Le paramètre "date" est obligatoire (ex: YYYY-MM-DD).');
    }

    const parts = dateStr.split('T')[0].split('-').map(Number);
    const startOfDay = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
    const endOfDay = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
    
    // Date cible au milieu de journée pour extraire le jour de la semaine en toute sécurité
    const targetDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    const jourSemaine = targetDate.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 5 = Vendredi, 6 = Samedi

    // 1. Récupérer tous les employés
    const employes = await this.prisma.employe.findMany({
      select: { id: true, nom: true, prenom: true, email: true },
    });

    // 2. Récupérer les pointages de cette date
    const pointages = await this.prisma.pointage.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });

    // 3. Récupérer TOUTES les demandes d'absence validées pour cette date
    const absences = await this.prisma.demandeAbsence.findMany({
      where: {
        status: 'VALIDE',
        dateDebut: { lte: endOfDay },
        dateFin: { gte: startOfDay },
      },
    });

    // 🆕 4. Récupérer les plannings actifs couvrant cette date
    const plannings = await this.prisma.planning.findMany({
      where: {
        dateDebut: { lte: endOfDay },
        dateFin: { gte: startOfDay },
      },
    });

    // 5. Initialisation des tableaux par catégorie
    const presents: Array<(typeof employes[number]) & { pointage: typeof pointages[number] }> = [];
    const enConges: Array<(typeof employes[number]) & { absence: typeof absences[number] }> = [];
    const enRecuperation: Array<(typeof employes[number]) & { absence: typeof absences[number] }> = [];
    const autresAbsences: Array<(typeof employes[number]) & { absence: typeof absences[number] }> = [];
    const enRepos: Array<(typeof employes[number]) & { motif: string }> = []; // 👈 🆕 Tableau Repos
    const absentsInjustifies: Array<typeof employes[number]> = [];

    // 6. Classification de chaque employé
    for (const emp of employes) {
      const pointage = pointages.find((pt) => pt.employeId === emp.id);
      const absence = absences.find((ab) => ab.employeId === emp.id);
      const planning = plannings.find((pl) => pl.employeId === emp.id);

      if (pointage) {
        // 🟢 Présent sur site ou ayant pointé
        presents.push({ ...emp, pointage });
      } else if (absence) {
        // 🟡 Absence autorisée : On aiguille selon le type exact
        const typeAbsence = String(absence.typeDemande || '').toUpperCase();

        if (typeAbsence === 'RECUPERATION' || typeAbsence === 'RTT') {
          enRecuperation.push({ ...emp, absence });
        } else if (typeAbsence === 'CONGE_PAYE' || typeAbsence === 'CONGE') {
          enConges.push({ ...emp, absence });
        } else {
          // Maladie, sans solde, événement familial, etc.
          autresAbsences.push({ ...emp, absence });
        }
      } else {
        // ⚪ 🆕 VÉRIFICATION DU REPOS VIA LE PLANNING (OU PAR DÉFAUT WEEK-END)
        // Jours de repos du planning de l'employé (ou [5, 6] Vendredi/Samedi par défaut si pas de planning)
        const planningData = planning as any;
        const joursReposEmp = typeof planningData?.joursRepos === 'string'
          ? planningData.joursRepos.split(',').map(Number)
          : [5, 6];
        const estEnRepos = joursReposEmp.includes(jourSemaine) || planning?.type_travail === 'REPOS';

        if (estEnRepos) {
          enRepos.push({ ...emp, motif: 'Repos Hebdomadaire (Planning)' });
        } else {
          // 🔴 Ni pointage, ni congé, ni repos = Vraie Absence Injustifiée
          absentsInjustifies.push(emp);
        }
      }
    }

    // 🟢 RETOUR JSON COMPLET
    return {
      date: dateStr,
      statistiques: {
        totalEmployes: employes.length,
        totalPresents: presents.length,
        totalConges: enConges.length,
        totalRecuperation: enRecuperation.length,
        totalAutresAbsences: autresAbsences.length,
        totalEnRepos: enRepos.length,                   // 👈 🆕
        totalAbsentsInjustifies: absentsInjustifies.length,
      },
      presents,
      enConges,
      enRecuperation,
      autresAbsences,
      enRepos,                                           // 👈 🆕
      absentsInjustifies,
    };
  }
}
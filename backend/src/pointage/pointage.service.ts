import { Injectable, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';
import { CompteurService } from 'src/compteur/compteur.service';

@Injectable()
export class PointageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly compteurService: CompteurService,
  ) {}

  // =========================================================================
  // 🛠️ HELPERS PARTAGÉS : détection jour de repos (type_travail OU joursRepos)
  // =========================================================================
  private parseJoursRepos(raw: any): number[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(Number).filter((n) => !isNaN(n));
    const str = String(raw).trim();
    if (str.startsWith('[')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) return parsed.map(Number).filter((n) => !isNaN(n));
      } catch {
        // JSON invalide -> on retombe sur le parsing texte ci-dessous
      }
    }
    return str.replace(/[\[\]"]/g, '').split(/[\s,;-]+/).map((s) => parseInt(s, 10)).filter((n) => !isNaN(n));
  }

  private estJourRepos(planning: any, date: Date): boolean {
    const typePl = String(planning.type_travail || '').toUpperCase();
    if (
      typePl.includes('REPOS') ||
      typePl.includes('OFF') ||
      typePl.includes('WEEKEND') ||
      typePl.includes('WEEK_END') ||
      typePl.includes('FERIE')
    ) {
      return true;
    }
    const joursRepos = this.parseJoursRepos(planning.joursRepos);
    if (joursRepos.length === 0) return false;
    return joursRepos.includes(date.getUTCDay()); // 0=dimanche ... 6=samedi
  }

  private combinerDateHeure(jourUTC: Date, heureStr: string): Date {
    const [h, m] = (heureStr || '00:00').split(':').map(Number);
    return new Date(Date.UTC(jourUTC.getUTCFullYear(), jourUTC.getUTCMonth(), jourUTC.getUTCDate(), h || 0, m || 0, 0));
  }

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
          // 🔧 utilise le helper conscient de joursRepos, pas juste type_travail === 'REPOS'
          if (this.estJourRepos(planning, start)) {
            dureeTheoriqueBase = 0.0;
          } else {
            const hDebutStr = planning.heureDebut ?? '08:00';
            const hFinStr = planning.heureFin ?? '16:00';
            const [hDeb, mDeb] = hDebutStr.split(':').map(Number);
            const [hFin, mFin] = hFinStr.split(':').map(Number);
            dureeTheoriqueBase = hFin + mFin / 60 - (hDeb + mDeb / 60);
          }
        } else {
          const jourSemaine = start.getUTCDay();
          dureeTheoriqueBase = jourSemaine === 5 || jourSemaine === 6 ? 0.0 : 8.0;
        }

        const dureeTheoriqueAjustee = Math.max(0, dureeTheoriqueBase - heuresAbsenceTotal);
        creditDebitJour = Number((dureeHeures - dureeTheoriqueAjustee).toFixed(2));
      }

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
        // 🔧 diffCredit compare au marqueur précédent, qu'il s'agisse d'un
        // vrai pointage OU d'un marqueur d'absence automatique -> corrige
        // le compteur du delta exact, quel que soit ce qu'il y avait avant.
        diffCredit = (creditDebitJour || 0) - (existingPointage.creditDebit || 0);
        pointage = await this.prisma.pointage.update({
          where: { id: existingPointage.id },
          data: {
            heureDebut: start,
            heureFin: end,
            dureeHeures,
            creditDebit: creditDebitJour,
            estAbsenceAutomatique: false, // 🔧 un import réel écrase toujours un marqueur automatique
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
  // 🔧 Exclut les marqueurs d'absence automatique : ce ne sont pas de vrais
  // pointages, ils ne doivent jamais faire basculer un employé en PRÉSENT
  // dans la data-table / mon-planning.
  // =========================================================================
  async getPointagesParDate(dateStr: string) {
    const { startOfDay, endOfDay } = this.parseYMD(dateStr);

    const pointages = await this.prisma.pointage.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        estAbsenceAutomatique: false,
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
  // Ici on GARDE les marqueurs automatiques : c'est la vue utilisée pour le
  // calcul du crédit/débit hebdomadaire, où l'absence doit apparaître.
  // =========================================================================
  async getSemaineEmploye(employeId: number, dateDebutStr: string) {
    if (!dateDebutStr) {
      throw new BadRequestException('Le paramètre dateDebut est requis (YYYY-MM-DD).');
    }

    const debut = new Date(dateDebutStr);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 7);

    const aujourdhuiStr = new Date().toISOString().split('T')[0];

    const rawPointages = await this.prisma.pointage.findMany({
      where: { employeId, date: { gte: debut, lt: fin } },
      orderBy: { createdAt: 'desc' },
    });

    const uniqueMap = new Map<string, (typeof rawPointages)[0]>();
    for (const p of rawPointages) {
      const dateKey = p.date.toISOString().split('T')[0];
      if (!uniqueMap.has(dateKey)) uniqueMap.set(dateKey, p);
    }

    let pointages = Array.from(uniqueMap.values());

    const plannings = await this.prisma.planning.findMany({
      where: { employeId, dateDebut: { lte: fin }, dateFin: { gte: debut } },
    });

    // 🔧 Filet de sécurité uniquement : si la réconciliation nocturne n'a pas
    // encore tourné pour une date passée, on fabrique une entrée temporaire
    // (jamais persistée, jamais pour aujourd'hui ou le futur).
    for (let d = new Date(debut); d < fin; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      if (dateKey >= aujourdhuiStr) continue; // jamais aujourd'hui/futur : journée non terminée

      const existe = pointages.some((p) => p.date.toISOString().split('T')[0] === dateKey);
      if (!existe) {
        const planningJour = plannings.find((pl) => d >= pl.dateDebut && d <= pl.dateFin);
        if (planningJour && !this.estJourRepos(planningJour, d)) {
          let heuresPrevues = 8.0;
          if (planningJour.heureDebut && planningJour.heureFin) {
            const [hDebut, mDebut] = planningJour.heureDebut.split(':').map(Number);
            const [hFin, mFin] = planningJour.heureFin.split(':').map(Number);
            heuresPrevues = hFin + mFin / 60 - (hDebut + mDebut / 60);
          }

          pointages.push({
            id: -1,
            employeId,
            date: new Date(d),
            dureeHeures: 0,
            creditDebit: -heuresPrevues,
            createdAt: new Date(),
            estAbsenceAutomatique: true, // 🔧 cohérent avec le filtre front-end
          } as any);
        }
      }
    }

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
  // 🌙 RÉCONCILIATION AUTOMATIQUE DES ABSENCES (cron nocturne + rattrapage)
  // =========================================================================

  @Cron('0 1 * * *') // tous les jours à 01h00
  async handleCronReconciliationAbsences() {
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    const hierStr = `${hier.getFullYear()}-${String(hier.getMonth() + 1).padStart(2, '0')}-${String(hier.getDate()).padStart(2, '0')}`;
    const resultat = await this.reconcilierAbsencesPourDate(hierStr);
    console.log(`🌙 Réconciliation absences du ${hierStr} : ${resultat.traites} employé(s) débité(s).`);
  }

  /**
   * Persiste un débit d'absence pour chaque employé sans pointage, sans
   * absence validée couvrant la date, et dont le planning indique un jour
   * de travail. Idempotent : un pointage (réel ou déjà réconcilié) existant
   * pour ce jour bloque tout retraitement (contrainte @@unique en renfort).
   * Ne traite jamais aujourd'hui ou une date future.
   */
  async reconcilierAbsencesPourDate(dateStr: string): Promise<{ traites: number }> {
    const aujourdhuiStr = new Date().toISOString().split('T')[0];
    if (dateStr >= aujourdhuiStr) {
      throw new BadRequestException("Impossible de réconcilier une journée en cours ou future.");
    }

    const { startOfDay, endOfDay } = this.parseYMD(dateStr);
    const employes = await this.prisma.employe.findMany({ select: { id: true } });
    let traites = 0;

    for (const emp of employes) {
      const dejaTraite = await this.prisma.pointage.findFirst({
        where: { employeId: emp.id, date: { gte: startOfDay, lte: endOfDay } },
      });
      if (dejaTraite) continue;

      const planning = await this.prisma.planning.findFirst({
        where: { employeId: emp.id, dateDebut: { lte: startOfDay }, dateFin: { gte: startOfDay } },
      });
      if (!planning) continue;

      if (this.estJourRepos(planning, startOfDay)) continue;

      const absenceValidee = await this.prisma.demandeAbsence.findFirst({
        where: {
          employeId: emp.id,
          status: 'VALIDE',
          dateDebut: { lte: endOfDay },
          dateFin: { gte: startOfDay },
        },
      });
      if (absenceValidee) continue;

      let heuresPrevues = 8.0;
      if (planning.heureDebut && planning.heureFin) {
        const [hDeb, mDeb] = planning.heureDebut.split(':').map(Number);
        const [hFin, mFin] = planning.heureFin.split(':').map(Number);
        heuresPrevues = hFin + mFin / 60 - (hDeb + mDeb / 60);
      }

      try {
        await this.prisma.pointage.create({
          data: {
            date: startOfDay,
            heureDebut: this.combinerDateHeure(startOfDay, planning.heureDebut ?? '00:00'),
            heureFin: null,
            dureeHeures: 0,
            creditDebit: -heuresPrevues,
            employeId: emp.id,
            estAbsenceAutomatique: true,
          },
        });
      } catch (e: any) {
        // Contrainte @@unique([employeId, date]) : un pointage a été créé en
        // parallèle entre le check et l'insertion -> on ignore simplement.
        if (e.code !== 'P2002') throw e;
        continue;
      }

      await this.compteurService.ajusterCreditDebit(emp.id, -heuresPrevues);
      traites++;
    }

    return { traites };
  }

  /**
   * Rattrapage manuel sur une période (ex: avant l'activation du cron).
   * Ne traite jamais aujourd'hui ou le futur (voir reconcilierAbsencesPourDate).
   */
  async reconcilierAbsencesPourPeriode(
    dateDebutStr: string,
    dateFinStr: string,
  ): Promise<{ totalTraites: number; parJour: Record<string, number> }> {
    const debut = this.parseYMD(dateDebutStr).startOfDay;
    const fin = this.parseYMD(dateFinStr).startOfDay;
    const parJour: Record<string, number> = {};
    let totalTraites = 0;

    for (let d = new Date(debut); d <= fin; d.setUTCDate(d.getUTCDate() + 1)) {
      const dStr = d.toISOString().split('T')[0];
      const { traites } = await this.reconcilierAbsencesPourDate(dStr);
      parJour[dStr] = traites;
      totalTraites += traites;
    }

    return { totalTraites, parJour };
  }

  // =========================================================================
  // 🛠️ HELPERS PRIVÉS (inchangés)
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
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }

  private async getEmployeIdsSousChef(chefId: number): Promise<number[]> {
    const managedOrgs = await this.prisma.organization.findMany({
      where: { managerId: chefId },
      select: { path: true },
    });

    const validPaths = managedOrgs
      .map((org) => org.path)
      .filter((path): path is string => Boolean(path));

    if (validPaths.length === 0) {
      return [];
    }

    const subordinates = await this.prisma.employe.findMany({
      where: {
        OR: validPaths.map((path) => ({
          organization: { path: { startsWith: path } },
        })),
      },
      select: { id: true },
    });

    return subordinates.map((emp) => emp.id);
  }

  // 🔧 Exclut aussi les marqueurs d'absence automatique (même raison que
  // getPointagesParDate : ne pas fausser l'état affiché dans la data-table).
  async getPointagesEquipeParChef(chefId: number, dateStr: string) {
    const { startOfDay, endOfDay } = this.parseYMD(dateStr);
    const employeIds = await this.getEmployeIdsSousChef(chefId);

    if (employeIds.length === 0) {
      return { chefId, date: dateStr, total: 0, pointages: [] };
    }

    const pointages = await this.prisma.pointage.findMany({
      where: {
        employeId: { in: employeIds },
        date: { gte: startOfDay, lte: endOfDay },
        estAbsenceAutomatique: false,
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

    return { chefId, date: dateStr, total: pointages.length, pointages };
  }
}
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONFIG = {
  NB_JOURS_A_SEEDER: 7,
  PROBA_A_LHEURE: 0.70,
  PROBA_EN_RETARD: 0.15,
  RETARD_MIN_MINUTES: 10,
  RETARD_MAX_MINUTES: 45,
  PROLONGATION_JOURS: 60,
  PLANNING_PAR_DEFAUT: {
    type_travail: 'NORMAL',
    heureDebut: '08:00',
    heureFin: '16:00',
    joursRepos: JSON.stringify([5, 6]),
  },
};

function parseJoursRepos(raw: any): number[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(Number).filter((n) => !isNaN(n));
  const str = String(raw).trim();
  if (str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed.map(Number).filter((n) => !isNaN(n));
    } catch {
    }
  }
  return str.replace(/[\[\]"]/g, '').split(/[\s,;-]+/).map((s) => parseInt(s, 10)).filter((n) => !isNaN(n));
}

function estJourRepos(planning: any, date: Date): boolean {
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
  const joursRepos = parseJoursRepos(planning.joursRepos);
  if (joursRepos.length === 0) return false;
  return joursRepos.includes(date.getDay());
}

function dateYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ajouterJours(d: Date, n: number): Date {
  const copie = new Date(d);
  copie.setDate(copie.getDate() + n);
  return copie;
}

function debutJourUTC(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0));
}

function heureVersDateUTC(jour: Date, heureStr: string, decalageJour = 0): Date {
  const [h, m] = heureStr.split(':').map(Number);
  const j = ajouterJours(jour, decalageJour);
  return new Date(Date.UTC(j.getFullYear(), j.getMonth(), j.getDate(), h, m, 0));
}

function ajouterMinutesAleatoires(heureStr: string, minMin: number, maxMin: number): string {
  const [h, m] = heureStr.split(':').map(Number);
  const decalage = Math.floor(Math.random() * (maxMin - minMin + 1)) + minMin;
  const totalMinutes = h * 60 + m + decalage;
  const hh = Math.floor(totalMinutes / 60) % 24;
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

async function assurerPlanningActif(emp: { id: number; plannings: any[] }, aujourdhui: Date) {
  const planningsExistants = emp.plannings.sort(
    (a, b) => new Date(b.dateFin).getTime() - new Date(a.dateFin).getTime()
  );
  const dernierPlanning = planningsExistants[0];

  const estCouvert = dernierPlanning && new Date(dernierPlanning.dateFin) >= aujourdhui;
  if (estCouvert) return;

  const base = dernierPlanning ?? CONFIG.PLANNING_PAR_DEFAUT;
  const debutNouveauPlanning = dernierPlanning
    ? ajouterJours(new Date(dernierPlanning.dateFin), 1)
    : aujourdhui;

  await prisma.planning.create({
    data: {
      employeId: emp.id,
      dateDebut: debutJourUTC(debutNouveauPlanning),
      dateFin: debutJourUTC(ajouterJours(debutNouveauPlanning, CONFIG.PROLONGATION_JOURS)),
      type_travail: base.type_travail ?? 'NORMAL',
      heureDebut: base.heureDebut ?? '08:00',
      heureFin: base.heureFin ?? '16:00',
      typeShift: dernierPlanning?.typeShift ?? null,
      plageFixeDebut: dernierPlanning?.plageFixeDebut ?? null,
      plageFixeFin: dernierPlanning?.plageFixeFin ?? null,
      joursRepos: base.joursRepos ?? JSON.stringify([5, 6]),
    },
  });

  console.log(
    `   📅 Planning prolongé pour l'employé #${emp.id} à partir du ${dateYMD(debutNouveauPlanning)}`
  );
}

async function seedPointagesEtPlannings() {
  console.log('🌱 Démarrage du seed pointages/plannings...');

  const aujourdhui = debutJourUTC(new Date());
  const hier = ajouterJours(aujourdhui, -1);
  const debutFenetre = ajouterJours(aujourdhui, -CONFIG.NB_JOURS_A_SEEDER);

  const employes = await prisma.employe.findMany({
    include: { plannings: true },
  });

  if (employes.length === 0) {
    console.error("❌ Aucun employé trouvé.");
    return;
  }

  await prisma.pointage.deleteMany({
    where: {
      date: { gte: debutFenetre, lte: hier },
      employeId: { in: employes.map((e) => e.id) },
    },
  });

  let totalCrees = 0;
  let totalAbsences = 0;
  let totalRepos = 0;

  for (const emp of employes) {
    await assurerPlanningActif(emp, aujourdhui);

    const plannings = await prisma.planning.findMany({ where: { employeId: emp.id } });

    for (let d = new Date(debutFenetre); d <= hier; d = ajouterJours(d, 1)) {
      const planningJour = plannings.find((pl) => d >= pl.dateDebut && d <= pl.dateFin);
      if (!planningJour) continue;

      if (estJourRepos(planningJour, d)) {
        totalRepos++;
        continue;
      }

      const finJour = new Date(d);
      finJour.setUTCHours(23, 59, 59, 999);
      const absenceValidee = await prisma.demandeAbsence.findFirst({
        where: {
          employeId: emp.id,
          status: 'VALIDE',
          dateDebut: { lte: finJour },
          dateFin: { gte: d },
        },
      });
      if (absenceValidee) continue;

      const heureDebutPlanning = planningJour.heureDebut ?? '08:00';
      const heureFinPlanning = planningJour.heureFin ?? '16:00';
      const [hDeb, mDeb] = heureDebutPlanning.split(':').map(Number);
      const [hFin, mFin] = heureFinPlanning.split(':').map(Number);
      const heuresPrevues = hFin + mFin / 60 - (hDeb + mDeb / 60);
      const decalageFinJour = hDeb >= hFin ? 1 : 0;

      const tirage = Math.random();

      if (tirage < CONFIG.PROBA_A_LHEURE) {
        const heureDebutReelle = heureVersDateUTC(d, heureDebutPlanning, 0);
        const heureFinReelle = heureVersDateUTC(d, heureFinPlanning, decalageFinJour);

        await prisma.pointage.create({
          data: {
            date: debutJourUTC(d),
            heureDebut: heureDebutReelle,
            heureFin: heureFinReelle,
            dureeHeures: Number(heuresPrevues.toFixed(2)),
            creditDebit: 0,
            employeId: emp.id,
          },
        });
        totalCrees++;
      } else if (tirage < CONFIG.PROBA_A_LHEURE + CONFIG.PROBA_EN_RETARD) {
        const heureDebutAvecRetardStr = ajouterMinutesAleatoires(
          heureDebutPlanning,
          CONFIG.RETARD_MIN_MINUTES,
          CONFIG.RETARD_MAX_MINUTES
        );
        const heureDebutReelle = heureVersDateUTC(d, heureDebutAvecRetardStr, 0);
        const heureFinReelle = heureVersDateUTC(d, heureFinPlanning, decalageFinJour);

        const dureeReelle = (heureFinReelle.getTime() - heureDebutReelle.getTime()) / (1000 * 3600);
        const creditDebitJour = Number((dureeReelle - heuresPrevues).toFixed(2));

        await prisma.pointage.create({
          data: {
            date: debutJourUTC(d),
            heureDebut: heureDebutReelle,
            heureFin: heureFinReelle,
            dureeHeures: Number(dureeReelle.toFixed(2)),
            creditDebit: creditDebitJour,
            employeId: emp.id,
          },
        });
        totalCrees++;
      } else {
        totalAbsences++;
      }
    }
  }

  console.log(`✅ Seed terminé : ${totalCrees} pointage(s) créé(s), ${totalAbsences} jour(s) volontairement laissé(s) sans pointage (absences à observer), ${totalRepos} jour(s) de repos ignoré(s).`);
  console.log('ℹ️  Aucune valeur de Compteur n\'a été modifiée par ce script.');
}

seedPointagesEtPlannings()
  .catch((e) => {
    console.error('❌ Erreur de seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
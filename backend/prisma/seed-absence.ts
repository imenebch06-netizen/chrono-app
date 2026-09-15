import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  return joursRepos.includes(date.getUTCDay());
}

async function ajusterCreditDebit(employeId: number, diffCredit: number) {
  const compteur = await prisma.compteur.upsert({
    where: { employeId },
    update: {},
    create: { employeId, solde_conges: 0.0, solde_rtt: 0.0, credit_debit: 0.0 },
  });

  const nouveauCredit = Number((compteur.credit_debit + diffCredit).toFixed(2));
  const nouveauRtt = Math.max(0, nouveauCredit);

  await prisma.compteur.update({
    where: { employeId },
    data: { credit_debit: nouveauCredit, solde_rtt: nouveauRtt },
  });
}

async function main() {
  console.log('🔍 Recherche des pointages corrompus (heureFin <= heureDebut)...');

  const corrompus: Array<{
    id: number;
    date: Date;
    heureDebut: Date;
    heureFin: Date | null;
    dureeHeures: number | null;
    creditDebit: number | null;
    employeId: number;
  }> = await prisma.$queryRaw`
    SELECT id, date, heureDebut, heureFin, dureeHeures, creditDebit, employeId
    FROM Pointage
    WHERE heureFin IS NOT NULL AND heureFin <= heureDebut
  `;

  console.log(`⚠️  ${corrompus.length} pointage(s) corrompu(s) trouvé(s).`);

  let corriges = 0;
  let erreurs = 0;

  for (const p of corrompus) {
    try {
      const employeId = p.employeId;
      const ancienCreditDebit = p.creditDebit ?? 0;

      const heureDebut = new Date(p.heureDebut);
      let heureFinCorrigee = new Date(p.heureFin!);

      let joursAjoutes = 0;
      while (heureFinCorrigee.getTime() <= heureDebut.getTime() && joursAjoutes < 3) {
        heureFinCorrigee = new Date(heureFinCorrigee.getTime() + 24 * 60 * 60 * 1000);
        joursAjoutes++;
      }

      if (heureFinCorrigee.getTime() <= heureDebut.getTime()) {
        console.warn(`   ⏭️  Pointage #${p.id} (employé ${employeId}) ignoré : impossible de corriger après ${joursAjoutes} jour(s) ajoutés.`);
        erreurs++;
        continue;
      }

      const dureeBrute = (heureFinCorrigee.getTime() - heureDebut.getTime()) / (1000 * 60 * 60);

      const absencesValides = await prisma.demandeAbsence.findMany({
        where: {
          employeId,
          status: 'VALIDE',
          dateDebut: { lte: heureFinCorrigee },
          dateFin: { gte: heureDebut },
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

        const overlapStart = new Date(Math.max(heureDebut.getTime(), startAbs.getTime()));
        const overlapEnd = new Date(Math.min(heureFinCorrigee.getTime(), endAbs.getTime()));
        if (overlapStart < overlapEnd) {
          heuresChevauchement += (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
        }
      }

      const dureeHeures = Number(Math.max(0, dureeBrute - heuresChevauchement).toFixed(2));

      const planning = await prisma.planning.findFirst({
        where: { employeId, dateDebut: { lte: heureDebut }, dateFin: { gte: heureDebut } },
      });

      let dureeTheoriqueBase = 8.0;
      if (planning) {
        if (estJourRepos(planning, heureDebut)) {
          dureeTheoriqueBase = 0.0;
        } else if (planning.heureDebut && planning.heureFin) {
          const [hDeb, mDeb] = planning.heureDebut.split(':').map(Number);
          const [hFin, mFin] = planning.heureFin.split(':').map(Number);
          dureeTheoriqueBase = hFin + mFin / 60 - (hDeb + mDeb / 60);
          if (dureeTheoriqueBase <= 0) dureeTheoriqueBase += 24;
        }
      } else {
        const jourSemaine = heureDebut.getUTCDay();
        dureeTheoriqueBase = jourSemaine === 5 || jourSemaine === 6 ? 0.0 : 8.0;
      }

      const dureeTheoriqueAjustee = Math.max(0, dureeTheoriqueBase - heuresAbsenceTotal);
      const nouveauCreditDebit = Number((dureeHeures - dureeTheoriqueAjustee).toFixed(2));

      await prisma.pointage.update({
        where: { id: p.id },
        data: {
          heureFin: heureFinCorrigee,
          dureeHeures,
          creditDebit: nouveauCreditDebit,
        },
      });

      const diffCredit = Number((nouveauCreditDebit - ancienCreditDebit).toFixed(2));
      if (diffCredit !== 0) {
        await ajusterCreditDebit(employeId, diffCredit);
      }

      console.log(
        `   ✅ Pointage #${p.id} (employé ${employeId}) : dureeHeures ${p.dureeHeures} -> ${dureeHeures}, creditDebit ${ancienCreditDebit} -> ${nouveauCreditDebit} (compteur ajusté de ${diffCredit >= 0 ? '+' : ''}${diffCredit})`,
      );
      corriges++;
    } catch (e) {
      console.error(`   ❌ Erreur sur le pointage #${p.id} :`, e);
      erreurs++;
    }
  }

  console.log(`\n✅ Terminé : ${corriges} pointage(s) corrigé(s), ${erreurs} ignoré(s)/en erreur sur ${corrompus.length} détecté(s).`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur générale :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
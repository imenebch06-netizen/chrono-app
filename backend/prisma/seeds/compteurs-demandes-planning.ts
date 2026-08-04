import { PrismaClient, StatutDemande, TypeDemande } from '@prisma/client';

export async function seedCompteursDemandesAndPlanning(prisma: PrismaClient) {
  console.log('🌱 3/3 - Création des Compteurs, Demandes et Plannings...');

  const employes = await prisma.employe.findMany();

  // 1. Initialisation des compteurs pour TOUS les employés
  for (const emp of employes) {
    await prisma.compteur.create({
      data: {
        employeId: emp.id,
        solde_conges: 25.0,
        solde_rtt: 12.0,
        credit_debit: 0.0,
      },
    });
  }

  // Sélection d'un employé de test
  const testEmploye = employes.find((e) => e.email === 'yacine.meziani@entreprise.com');

  if (testEmploye) {
    // 2. Création de demandes d'absence de démonstration
    await prisma.demandeAbsence.createMany({
      data: [
        {
          employeId: testEmploye.id,
          typeDemande: TypeDemande.CONGE,
          type_conge: 'Payé',
          dateDebut: new Date('2026-08-10T08:00:00Z'),
          dateFin: new Date('2026-08-15T17:00:00Z'),
          status: StatutDemande.EN_ATTENTE,
          motif: 'Congés d été',
        },
        {
          employeId: testEmploye.id,
          typeDemande: TypeDemande.RECUPERATION,
          heures_a_recuperer: 7.5,
          dateDebut: new Date('2026-08-20T08:00:00Z'),
          dateFin: new Date('2026-08-20T16:30:00Z'),
          status: StatutDemande.VALIDE,
          motif: 'Récupération heures supplémentaires',
        },
      ],
    });

    // 3. Création d'un Planning de travail
    await prisma.planning.create({
      data: {
        employeId: testEmploye.id,
        dateDebut: new Date('2026-08-01T00:00:00Z'),
        dateFin: new Date('2026-08-31T23:59:59Z'),
        heureDebut: '08:30',
        heureFin: '17:00',
        type_travail: 'NORMAL',
        joursRepos: '5,6', // Samedi, Dimanche
      },
    });

    // 4. Création d'un exemple de Pointage
    await prisma.pointage.create({
      data: {
        employeId: testEmploye.id,
        date: new Date('2026-08-03T00:00:00Z'),
        heureDebut: new Date('2026-08-03T08:25:00Z'),
        heureFin: new Date('2026-08-03T17:05:00Z'),
        dureeHeures: 8.66,
        creditDebit: 0.16,
      },
    });
  }

  console.log('✅ Compteurs, Demandes et Plannings générés !');
}
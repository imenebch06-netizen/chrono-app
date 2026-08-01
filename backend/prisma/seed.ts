import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du Seeding...');

  // 1. Création d'une Direction de test
  const direction = await prisma.direction.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nom_direction: 'Direction Générale',
    },
  });

  // 2. Création d'un Service de test rattaché à la Direction
  const service = await prisma.service.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nom_service: 'Systèmes d Information',
      directionId: direction.id,
    },
  });

 // 3. Création / Récupération de l'Employé (Recherche par EMAIL 👈)
  const employe = await prisma.employe.upsert({
    where: { email: 'karim.benali@example.com' }, // 👈 Recherche par email unique
    update: {},
    create: {
      nom: 'Benali',
      prenom: 'Karim',
      email: 'karim.benali@example.com',
      password: 'password123',
      serviceId: service.id,
    },
  });

  // 4. Nettoyage et Création du Planning de l'employé
  await prisma.planning.deleteMany({
    where: { employeId: employe.id },
  });
  // 5. Création de son planning (Vendredi/Samedi en repos)
  await prisma.planning.create({
    data: {
      employeId: employe.id,
      heureDebut: '08:00',
      heureFin: '16:00',
      type_travail: 'NORMAL',
      joursRepos: '5,6', // 👈 5 = Vendredi, 6 = Samedi
      dateDebut: new Date('2026-01-01'),
      dateFin: new Date('2026-12-31'),
    },
  });

  // 5. Initialisation de son compteur
  await prisma.compteur.upsert({
    where: { employeId: employe.id },
    update: {},
    create: {
      employeId: employe.id,
      solde_conges: 25.0,
      solde_rtt: 0.0,
      credit_debit: 0.0,
    },
  });

  console.log('✅ Base de données alimentée avec succès (Direction, Service, Employé, Planning, Compteur) !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
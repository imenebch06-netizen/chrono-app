import { PrismaClient } from '@prisma/client';
import { seedDirectionsAndServices } from './seeds/directions-services';
import { seedEmployes } from './seeds/employe';
import { seedCompteursDemandesAndPlanning } from './seeds/compteurs-demandes-planning';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Nettoyage de la base de données...');
  
  // Suppression dans l'ordre inverse des relations
  await prisma.pointage.deleteMany();
  await prisma.planning.deleteMany();
  await prisma.demandeAbsence.deleteMany();
  await prisma.compteur.deleteMany();

  // Annulation des liens de management sur Direction et Service pour libérer la suppression d'Employe
  await prisma.direction.updateMany({ data: { managerId: null } });
  await prisma.service.updateMany({ data: { managerId: null } });

  await prisma.employe.deleteMany();
  await prisma.service.deleteMany();
  await prisma.direction.deleteMany();

  console.log('✨ Base de données nettoyée avec succès !');
}

async function main() {
  console.log('🚀 Démarrage du Seeding Global...\n');

  await cleanDatabase();

  await seedDirectionsAndServices(prisma);
  await seedEmployes(prisma);
  await seedCompteursDemandesAndPlanning(prisma);

  console.log('\n🎉 Tout le processus de seed s est déroulé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur critique lors du seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du remplissage automatique de la BDD...');

  // 1. Hash du mot de passe par défaut
  const defaultPassword = await bcrypt.hash('password123', 10);

  // 2. Récupération des organisations
  const organizations = await prisma.organization.findMany();

  if (organizations.length === 0) {
    console.error('❌ Aucune organisation trouvée en BDD.');
    return;
  }

  console.log(`🏢 ${organizations.length} organisations trouvées. Génération des employés...`);

  // Liste de villes fictives pour varier un peu
  const villes = ['Paris', 'Lyon', 'Marseille', 'Lille', 'Bordeaux', 'Nantes', 'Toulouse'];

  for (const org of organizations) {
    const villeIndex = org.id % villes.length;
    const ville = villes[villeIndex];

    // ---------------------------------------------------------------------
    // A. MANAGER DE L'ORGANISATION
    // ---------------------------------------------------------------------
  // 1. Pour le Manager
const manager = await prisma.employe.create({
  data: {
    nom: `Manager_${org.nom.replace(/\s+/g, '_')}`,
    prenom: 'Chef',
    email: `manager.${org.id}@entreprise.com`,
    adress: `10 Avenue de la Direction, 7500${(org.id % 9) + 1} ${ville}`, // 👈 "adress" au lieu de "adresse"
    password: defaultPassword,
    role: Role.EMPLOYE,
    organizationId: org.id,
  },
});

// 2. Pour les Employés
for (let i = 1; i <= 2; i++) {
  await prisma.employe.create({
    data: {
      nom: `Agent_${i}`,
      prenom: org.nom.substring(0, 10),
      email: `employe.${org.id}.${i}@entreprise.com`,
      adress: `${12 + i * 5} Rue des Métiers, Bat ${i}, ${ville}`, // 👈 "adress" au lieu de "adresse"
      password: defaultPassword,
      role: Role.EMPLOYE,
      organizationId: org.id,
    },
  });
}

    console.log(`✅ ${org.nom} : Manager et employés créés avec adresses.`);
  }

  console.log('🚀 Remplissage de la base de données terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
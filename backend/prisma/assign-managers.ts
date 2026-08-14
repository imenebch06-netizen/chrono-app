import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignManagers() {
  console.log('🔄 Attribution des managers aux organisations existantes...');

  // 1. Récupérer toutes les organisations
  const organizations = await prisma.organization.findMany();

  if (organizations.length === 0) {
    console.error('❌ Aucune organisation trouvée.');
    return;
  }

  let count = 0;

  for (const org of organizations) {
    // 2. Trouver un employé appartenant à cette organisation
    // On priorise celui qui a "manager" dans son email, sinon le tout premier trouvé
    const managerCandidate = await prisma.employe.findFirst({
      where: {
        organizationId: org.id,
      },
      orderBy: [
        { email: 'asc' }, // Priorise manager.X@entreprise.com
        { id: 'asc' },
      ],
    });

    if (managerCandidate) {
      // 3. Mettre à jour uniquement le champ managerId de l'organisation
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          managerId: managerCandidate.id,
        },
      });

      console.log(
        `✅ Org "${org.nom}" (ID: ${org.id}) ➔ Manager attribué : ${managerCandidate.nom} (ID: ${managerCandidate.id})`,
      );
      count++;
    } else {
      console.warn(`⚠️ Aucun employé trouvé dans l'organisation "${org.nom}" (ID: ${org.id})`);
    }
  }

  console.log(`\n🚀 Opération terminée ! ${count} organisations ont maintenant un manager.`);
}

assignManagers()
  .catch((e) => {
    console.error('❌ Erreur :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
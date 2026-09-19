import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignManagers() {
  console.log('🔄 Attribution des managers aux organisations existantes...');

  
  const organizations = await prisma.organization.findMany();

  if (organizations.length === 0) {
    console.error('❌ Aucune organisation trouvée.');
    return;
  }

  let count = 0;

  for (const org of organizations) {
  
  
    const managerCandidate = await prisma.employe.findFirst({
      where: {
        organizationId: org.id,
      },
      orderBy: [
        { email: 'asc' }, 
        { id: 'asc' },
      ],
    });

    if (managerCandidate) {
      
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
import { PrismaClient } from '@prisma/client';

export async function seedDirectionsAndServices(prisma: PrismaClient) {
  console.log('🌱 1/3 - Création des Directions et Services...');

  // Direction 1 : Informatique
  const dirIT = await prisma.direction.create({
    data: {
      nom_direction: 'Direction des Systèmes d Information',
      services: {
        create: [
          { nom_service: 'Développement Logiciel' },
          { nom_service: 'Infrastructure & Réseaux' },
        ],
      },
    },
    include: { services: true },
  });

  // Direction 2 : RH
  const dirRH = await prisma.direction.create({
    data: {
      nom_direction: 'Direction des Ressources Humaines',
      services: {
        create: [
          { nom_service: 'Gestion du Personnel' },
          { nom_service: 'Recrutement & Formation' },
        ],
      },
    },
    include: { services: true },
  });

  console.log('✅ Directions et Services créés avec succès !');
  return { dirIT, dirRH };
}
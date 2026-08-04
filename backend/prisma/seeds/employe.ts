import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedEmployes(prisma: PrismaClient) {
  console.log('🌱 2/3 - Création des Employés et affectation des rôles...');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Récupération des services créés précédemment
  const serviceDev = await prisma.service.findFirst({
    where: { nom_service: 'Développement Logiciel' },
    include: { direction: true },
  });

  const serviceRh = await prisma.service.findFirst({
    where: { nom_service: 'Gestion du Personnel' },
    include: { direction: true },
  });

  if (!serviceDev || !serviceRh) {
    throw new Error('Les services requis sont introuvables.');
  }

  // 1. Administrateur Global
  const admin = await prisma.employe.create({
    data: {
      nom: 'SYSTEM',
      prenom: 'Admin',
      email: 'admin@entreprise.com',
      password: hashedPassword,
      role: Role.ADMIN,
      adress: '10 Rue de la Paix, Paris',
    },
  });

  // 2. Manager de Direction (Gère la Direction IT)
  const managerDirectionIT = await prisma.employe.create({
    data: {
      nom: 'BENALI',
      prenom: 'Karim',
      email: 'karim.benali@entreprise.com',
      password: hashedPassword,
      role: Role.MANAGER,
      serviceId: serviceDev.id,
    },
  });

  // Lier le manager à la Direction IT
  await prisma.direction.update({
    where: { id: serviceDev.directionId },
    data: { managerId: managerDirectionIT.id },
  });

  // 3. Manager de Service (Superviseur direct du service Dev)
  const managerServiceDev = await prisma.employe.create({
    data: {
      nom: 'MANSOURI',
      prenom: 'Sonia',
      email: 'sonia.mansouri@entreprise.com',
      password: hashedPassword,
      role: Role.MANAGER,
      serviceId: serviceDev.id,
      managerId: managerDirectionIT.id, // Hiérarchie entre managers
    },
  });

  // 4. Employés simples (Subordonnés de Sonia)
  const employe1 = await prisma.employe.create({
    data: {
      nom: 'MEZIANI',
      prenom: 'Yacine',
      email: 'yacine.meziani@entreprise.com',
      password: hashedPassword,
      role: Role.EMPLOYE,
      serviceId: serviceDev.id,
      managerId: managerServiceDev.id, // Supervision directe
    },
  });

  const employe2 = await prisma.employe.create({
    data: {
      nom: 'KHADRA',
      prenom: 'Lina',
      email: 'lina.khadra@entreprise.com',
      password: hashedPassword,
      role: Role.EMPLOYE,
      serviceId: serviceRh.id,
    },
  });

  console.log('✅ Employés et hiérarchies créés !');
  return { admin, managerDirectionIT, managerServiceDev, employe1, employe2 };
}
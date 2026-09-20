-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYE', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatutDemande" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REFUSE');

-- CreateEnum
CREATE TYPE "TypeDemande" AS ENUM ('CONGE', 'ABSENCE', 'RECUPERATION');

-- CreateTable
CREATE TABLE "TypeOrganization" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "TypeOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "nom_en" TEXT,
    "path" TEXT,
    "typeOrganizationId" INTEGER NOT NULL,
    "idOrganizationSup" INTEGER,
    "managerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employe" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "adress" TEXT,
    "adress_en" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYE',
    "organizationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandeAbsence" (
    "id" SERIAL NOT NULL,
    "typeDemande" "TypeDemande" NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "status" "StatutDemande" NOT NULL DEFAULT 'EN_ATTENTE',
    "motif" TEXT NOT NULL,
    "justificatif" TEXT,
    "type_conge" TEXT,
    "justifie" BOOLEAN DEFAULT false,
    "heures_a_recuperer" DOUBLE PRECISION,
    "employeId" INTEGER NOT NULL,
    "planningId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemandeAbsence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planning" (
    "id" SERIAL NOT NULL,
    "employeId" INTEGER NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "heureDebut" TEXT,
    "heureFin" TEXT,
    "type_travail" TEXT NOT NULL,
    "typeShift" TEXT,
    "plageFixeDebut" TEXT,
    "plageFixeFin" TEXT,
    "joursRepos" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Planning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pointage" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "heureDebut" TIMESTAMP(3) NOT NULL,
    "heureFin" TIMESTAMP(3),
    "dureeHeures" DOUBLE PRECISION,
    "creditDebit" DOUBLE PRECISION,
    "estAbsenceAutomatique" BOOLEAN NOT NULL DEFAULT false,
    "employeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pointage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compteur" (
    "id" SERIAL NOT NULL,
    "solde_conges" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "solde_rtt" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "credit_debit" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "employeId" INTEGER NOT NULL,

    CONSTRAINT "Compteur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "employeId" INTEGER NOT NULL,
    "demandeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TypeOrganization_code_key" ON "TypeOrganization"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_managerId_key" ON "Organization"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "Employe_email_key" ON "Employe"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pointage_employeId_date_key" ON "Pointage"("employeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Compteur_employeId_key" ON "Compteur"("employeId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_typeOrganizationId_fkey" FOREIGN KEY ("typeOrganizationId") REFERENCES "TypeOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_idOrganizationSup_fkey" FOREIGN KEY ("idOrganizationSup") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employe" ADD CONSTRAINT "Employe_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeAbsence" ADD CONSTRAINT "DemandeAbsence_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "Employe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeAbsence" ADD CONSTRAINT "DemandeAbsence_planningId_fkey" FOREIGN KEY ("planningId") REFERENCES "Planning"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planning" ADD CONSTRAINT "Planning_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "Employe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pointage" ADD CONSTRAINT "Pointage_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "Employe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compteur" ADD CONSTRAINT "Compteur_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "Employe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "Employe"("id") ON DELETE CASCADE ON UPDATE CASCADE;


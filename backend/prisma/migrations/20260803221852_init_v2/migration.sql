-- CreateTable
CREATE TABLE `Direction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom_direction` VARCHAR(191) NOT NULL,
    `managerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Direction_managerId_key`(`managerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Service` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom_service` VARCHAR(191) NOT NULL,
    `directionId` INTEGER NOT NULL,
    `managerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employe` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `adress` VARCHAR(191) NULL,
    `role` ENUM('EMPLOYE', 'MANAGER', 'ADMIN') NOT NULL DEFAULT 'EMPLOYE',
    `serviceId` INTEGER NULL,
    `managerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Employe_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DemandeAbsence` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `typeDemande` ENUM('CONGE', 'ABSENCE', 'RECUPERATION') NOT NULL,
    `dateDebut` DATETIME(3) NOT NULL,
    `dateFin` DATETIME(3) NOT NULL,
    `status` ENUM('EN_ATTENTE', 'VALIDE', 'REFUSE') NOT NULL DEFAULT 'EN_ATTENTE',
    `motif` VARCHAR(191) NOT NULL,
    `justificatif` VARCHAR(191) NULL,
    `type_conge` VARCHAR(191) NULL,
    `justifie` BOOLEAN NULL DEFAULT false,
    `heures_a_recuperer` DOUBLE NULL,
    `employeId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Planning` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeId` INTEGER NOT NULL,
    `dateDebut` DATETIME(3) NOT NULL,
    `dateFin` DATETIME(3) NOT NULL,
    `heureDebut` VARCHAR(191) NULL,
    `heureFin` VARCHAR(191) NULL,
    `type_travail` VARCHAR(191) NOT NULL,
    `typeShift` VARCHAR(191) NULL,
    `plageFixeDebut` VARCHAR(191) NULL,
    `plageFixeFin` VARCHAR(191) NULL,
    `joursRepos` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pointage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `heureDebut` DATETIME(3) NOT NULL,
    `heureFin` DATETIME(3) NULL,
    `dureeHeures` DOUBLE NULL,
    `creditDebit` DOUBLE NULL,
    `employeId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Pointage_employeId_date_key`(`employeId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Compteur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solde_conges` DOUBLE NOT NULL DEFAULT 25.0,
    `solde_rtt` DOUBLE NOT NULL DEFAULT 0.0,
    `credit_debit` DOUBLE NOT NULL DEFAULT 0.0,
    `employeId` INTEGER NOT NULL,

    UNIQUE INDEX `Compteur_employeId_key`(`employeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Direction` ADD CONSTRAINT `Direction_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `Employe`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Service` ADD CONSTRAINT `Service_directionId_fkey` FOREIGN KEY (`directionId`) REFERENCES `Direction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Service` ADD CONSTRAINT `Service_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `Employe`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employe` ADD CONSTRAINT `Employe_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employe` ADD CONSTRAINT `Employe_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `Employe`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DemandeAbsence` ADD CONSTRAINT `DemandeAbsence_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `Employe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Planning` ADD CONSTRAINT `Planning_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `Employe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pointage` ADD CONSTRAINT `Pointage_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `Employe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Compteur` ADD CONSTRAINT `Compteur_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `Employe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

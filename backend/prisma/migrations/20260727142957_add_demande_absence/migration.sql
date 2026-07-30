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

-- AddForeignKey
ALTER TABLE `DemandeAbsence` ADD CONSTRAINT `DemandeAbsence_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `Employe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

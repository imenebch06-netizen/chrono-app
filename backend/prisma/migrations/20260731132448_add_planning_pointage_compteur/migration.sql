-- CreateTable
CREATE TABLE `Planning` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dateDebut` DATETIME(3) NOT NULL,
    `dateFin` DATETIME(3) NOT NULL,
    `heureDebut` VARCHAR(191) NOT NULL,
    `heureFin` VARCHAR(191) NOT NULL,
    `type_travail` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `employeId` INTEGER NOT NULL,
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
ALTER TABLE `Planning` ADD CONSTRAINT `Planning_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `Employe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pointage` ADD CONSTRAINT `Pointage_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `Employe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Compteur` ADD CONSTRAINT `Compteur_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `Employe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `managerId` on the `employe` table. All the data in the column will be lost.
  - You are about to drop the column `serviceId` on the `employe` table. All the data in the column will be lost.
  - You are about to drop the `direction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `direction` DROP FOREIGN KEY `Direction_managerId_fkey`;

-- DropForeignKey
ALTER TABLE `employe` DROP FOREIGN KEY `Employe_managerId_fkey`;

-- DropForeignKey
ALTER TABLE `employe` DROP FOREIGN KEY `Employe_serviceId_fkey`;

-- DropForeignKey
ALTER TABLE `planning` DROP FOREIGN KEY `Planning_employeId_fkey`;

-- DropForeignKey
ALTER TABLE `service` DROP FOREIGN KEY `Service_directionId_fkey`;

-- DropForeignKey
ALTER TABLE `service` DROP FOREIGN KEY `Service_managerId_fkey`;

-- AlterTable
ALTER TABLE `employe` DROP COLUMN `managerId`,
    DROP COLUMN `serviceId`,
    ADD COLUMN `organizationId` INTEGER NULL;

-- DropTable
DROP TABLE `direction`;

-- DropTable
DROP TABLE `service`;

-- CreateTable
CREATE TABLE `TypeOrganization` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `TypeOrganization_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Organization` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NULL,
    `typeOrganizationId` INTEGER NOT NULL,
    `idOrganizationSup` INTEGER NULL,
    `managerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Organization_managerId_key`(`managerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Organization` ADD CONSTRAINT `Organization_typeOrganizationId_fkey` FOREIGN KEY (`typeOrganizationId`) REFERENCES `TypeOrganization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Organization` ADD CONSTRAINT `Organization_idOrganizationSup_fkey` FOREIGN KEY (`idOrganizationSup`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Organization` ADD CONSTRAINT `Organization_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `Employe`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employe` ADD CONSTRAINT `Employe_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Planning` ADD CONSTRAINT `Planning_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `Employe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

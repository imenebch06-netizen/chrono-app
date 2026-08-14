/*
  Warnings:

  - The values [MANAGER] on the enum `Employe_role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `demandeabsence` ADD COLUMN `planningId` INTEGER NULL;

-- AlterTable
ALTER TABLE `employe` MODIFY `role` ENUM('EMPLOYE', 'ADMIN') NOT NULL DEFAULT 'EMPLOYE';

-- AddForeignKey
ALTER TABLE `DemandeAbsence` ADD CONSTRAINT `DemandeAbsence_planningId_fkey` FOREIGN KEY (`planningId`) REFERENCES `Planning`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

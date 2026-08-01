/*
  Warnings:

  - A unique constraint covering the columns `[employeId,date]` on the table `Pointage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `planning` ADD COLUMN `joursRepos` VARCHAR(191) NOT NULL DEFAULT '5,6';

-- CreateIndex
CREATE UNIQUE INDEX `Pointage_employeId_date_key` ON `Pointage`(`employeId`, `date`);

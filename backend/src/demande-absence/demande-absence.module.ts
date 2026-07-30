import { Module } from '@nestjs/common';
import { DemandeAbsenceService } from './demande-absence.service';
import { DemandeAbsenceController } from './demande-absence.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module'; // 👈 Vérifie le chemin de l'import

@Module({
  imports: [
    PrismaModule, 
    UploadModule, // 👈 OBLIGATOIRE : permet à DemandeAbsence d'utiliser UploadService
  ],
  controllers: [DemandeAbsenceController],
  providers: [DemandeAbsenceService],
  exports: [DemandeAbsenceService],
})
export class DemandeAbsenceModule {}
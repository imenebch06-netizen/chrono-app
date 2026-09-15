import { Module } from '@nestjs/common';
import { DemandeAbsenceService } from './demande-absence.service';
import { DemandeAbsenceController } from './demande-absence.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module'; 
import { CompteurModule } from 'src/compteur/compteur.module';

@Module({
  imports: [
    PrismaModule,
    UploadModule,
    CompteurModule 
  ],
  controllers: [DemandeAbsenceController],
  providers: [DemandeAbsenceService],
  exports: [DemandeAbsenceService],
})
export class DemandeAbsenceModule {}

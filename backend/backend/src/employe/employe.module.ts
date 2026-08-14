import { Module } from '@nestjs/common';
import { EmployeService } from './employe.service';
import { EmployeController } from './employe.controller';
import { CompteurModule } from 'src/compteur/compteur.module';
import { PointageModule } from 'src/pointage/pointage.module';
import { PlanningModule } from 'src/planning/planning.module';
import { DemandeAbsenceModule } from 'src/demande-absence/demande-absence.module';

@Module({
  imports: [PlanningModule,
    PointageModule,
    CompteurModule,
    DemandeAbsenceModule,],
  providers: [EmployeService],
  controllers: [EmployeController],
  exports: [EmployeService],
  
})
export class EmployeModule {}

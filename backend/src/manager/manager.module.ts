import { Module } from '@nestjs/common';
import { ManagerController } from './manager.controller';
import { PointageService } from 'src/pointage/pointage.service';
import { DemandeAbsenceService } from 'src/demande-absence/demande-absence.service';
import { PlanningService } from 'src/planning/planning.service';
import { EmployeService } from 'src/employe/employe.service';
import { UploadService } from 'src/upload/upload.service';

@Module({
    imports: [  ],
    controllers: [ManagerController],
    providers: [PointageService,
                DemandeAbsenceService,
                PlanningService,
                EmployeService,
                UploadService
            ],
    exports: [],
})
export class ManagerModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmployeModule } from './employe/employe.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { DemandeAbsenceModule } from './demande-absence/demande-absence.module';
import { PlanningController } from './planning/planning.controller';
import { PlanningService } from './planning/planning.service';
import { PlanningModule } from './planning/planning.module';
import { PointageModule } from './pointage/pointage.module';
import { CompteurModule } from './compteur/compteur.module';
import { ScheduleModule } from '@nestjs/schedule';

import { OrganisationModule } from './organisation/organisation.module';
import { NotificationController } from './notification/notification.controller';
import { NotificationService } from './notification/notification.service';
import { NotificationModule } from './notification/notification.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CloudinaryModule,
    PrismaModule,
    EmployeModule,
    AuthModule,
    UploadModule,
    DemandeAbsenceModule,
    PlanningModule,
    PointageModule,
    CompteurModule,
    ScheduleModule.forRoot(),
  
    OrganisationModule,

    NotificationModule,
  ],
  controllers: [AppController, PlanningController, NotificationController],
  providers: [AppService, PlanningService, NotificationService],
})
export class AppModule {}

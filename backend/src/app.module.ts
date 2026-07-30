import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmployeModule } from './employe/employe.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { ServicesModule } from './service/service.module';
import { DirectionsModule } from './direction/direction.module';
import { DemandeAbsenceModule } from './demande-absence/demande-absence.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CloudinaryModule,
    PrismaModule,
    EmployeModule,
    AuthModule,
    UploadModule,
    ServicesModule,
    DirectionsModule,
    DemandeAbsenceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

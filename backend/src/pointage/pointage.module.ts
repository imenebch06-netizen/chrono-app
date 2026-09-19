import { Module } from '@nestjs/common';
import { PointageController } from './pointage.controller';
import { PointageService } from './pointage.service';
import { CompteurModule } from 'src/compteur/compteur.module';

@Module({
  imports: [CompteurModule],
  controllers: [PointageController],
  providers: [PointageService],
  exports: [PointageService],
})
export class PointageModule {}

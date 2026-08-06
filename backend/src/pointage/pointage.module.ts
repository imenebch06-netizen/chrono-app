import { Module } from '@nestjs/common';
import { PointageController } from './pointage.controller';
import { PointageService } from './pointage.service';

@Module({
  controllers: [PointageController],
  providers: [PointageService],
  exports: [PointageService],
})
export class PointageModule {}

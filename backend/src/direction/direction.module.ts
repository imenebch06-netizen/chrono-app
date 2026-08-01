import { Module } from '@nestjs/common';
import { DirectionsService } from './direction.service';
import { DirectionsController } from './direction.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DirectionsController],
  providers: [DirectionsService],
  exports: [DirectionsService],
})
export class DirectionsModule {}

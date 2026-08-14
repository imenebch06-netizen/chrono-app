
import { Module } from '@nestjs/common';
import { CompteurService } from './compteur.service';
import { CompteurController } from './compteur.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CompteurController],
  providers: [CompteurService],
  exports: [CompteurService],
})
export class CompteurModule {}

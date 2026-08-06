import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnershipOrSameServiceGuard } from '../auth/guards/ownership-or-same-service.guard';
import { PlanningService } from '../planning/planning.service';
import { PointageService } from '../pointage/pointage.service';
import { CompteurService } from '../compteur/compteur.service';
import { DemandeAbsenceService } from '../demande-absence/demande-absence.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateDemandeAbsenceDto } from 'src/demande-absence/dto/create-demande-absence.dto';

@ApiTags('Dashboard Employé')
@ApiBearerAuth()
@Controller('employe/dashboard')
export class EmployeController {
  constructor(
    private readonly planningService: PlanningService,
    private readonly pointageService: PointageService,
    private readonly compteurService: CompteurService,
    private readonly demandeAbsenceService: DemandeAbsenceService,
  ) {}

  // 1️⃣ Consulter son planning
  @Get(':employeId/planning')
  @UseGuards(JwtAuthGuard, OwnershipOrSameServiceGuard)
  @ApiOperation({ summary: "Consulter le planning d'un employé" })
  async getPlanning(@Param('employeId', ParseIntPipe) employeId: number) {
    return this.planningService.findByEmploye(employeId);
  }

  // 2️⃣ Consulter ses pointages (semaine courante)
  @Get(':employeId/pointages')
  @UseGuards(JwtAuthGuard, OwnershipOrSameServiceGuard)
  @ApiOperation({ summary: "Consulter les pointages d'un employé" })
  async getPointages(@Param('employeId', ParseIntPipe) employeId: number) {
    return this.pointageService.getSemaineEmploye(employeId, new Date().toISOString());
  }

  // 3️⃣ Consulter ses compteurs (Congés/RTT)
  @Get(':employeId/compteur')
  @UseGuards(JwtAuthGuard, OwnershipOrSameServiceGuard)
  @ApiOperation({ summary: "Consulter les compteurs d'un employé" })
  async getCompteur(@Param('employeId', ParseIntPipe) employeId: number) {
    return this.compteurService.getByEmploye(employeId);
  }

  // 4️⃣ Consulter ses demandes d’absence
  @Get(':employeId/demandes')
  @UseGuards(JwtAuthGuard, OwnershipOrSameServiceGuard)
  @ApiOperation({ summary: "Consulter les demandes d'absence d'un employé" })
  async getDemandes(@Param('employeId', ParseIntPipe) employeId: number) {
    return this.demandeAbsenceService.findByEmploye(employeId);
  }

  // 5️⃣ Créer une demande d’absence
  @Post(':employeId/demande-absence')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('justificatif'))
  @ApiOperation({ summary: "Créer une demande d'absence avec justificatif" })
  async createDemandeAbsence(
    @Body() dto: CreateDemandeAbsenceDto,
    @Req() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.demandeAbsenceService.create(dto, req.user, file);
  }
}

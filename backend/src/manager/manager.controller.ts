import { Controller, Get, Post, Patch, Param, ParseIntPipe, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { PointageService } from '../pointage/pointage.service';
import { DemandeAbsenceService } from '../demande-absence/demande-absence.service';
import { PlanningService } from '../planning/planning.service';
import { EmployeService } from '../employe/employe.service';
import { CreatePlanningDto } from '../planning/dto/create-planning.dto';
import { UpdateStatusDto } from '../demande-absence/dto/update-status.dto';

@ApiTags('Dashboard Manager')
@ApiBearerAuth()
@Controller('manager')
export class ManagerController {
  constructor(
    private readonly pointageService: PointageService,
    private readonly demandeAbsenceService: DemandeAbsenceService,
    private readonly planningService: PlanningService,
    private readonly employeService: EmployeService,
  ) {}

  // 1️⃣ Pointages du jour ou d'une date donnée
  @Get(':managerId/pointages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: "Obtenir les pointages des employés du service (Jour J ou date donnée)" })
  @ApiParam({ name: 'managerId', example: 1 })
  @ApiQuery({ name: 'date', required: false, example: '2026-08-05' })
  async getPointages(@Param('managerId', ParseIntPipe) managerId: number, @Query('date') date?: string) {
    const jour = date ?? new Date().toISOString().split('T')[0];
    return this.pointageService.getEmployesByDate(jour);
  }

  // 2️⃣ Demandes en attente (employés du service + autres managers)
  @Get(':managerId/demandes-pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: "Obtenir les demandes en attente des employés du service et des autres managers" })
  async getDemandesPending(@Param('managerId', ParseIntPipe) managerId: number) {
    return this.demandeAbsenceService.findPendingByService(managerId, { role: Role.MANAGER, serviceId: managerId });
  }

 @Patch('demandes/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: "Valider ou refuser une demande en attente" })
  @ApiParam({ name: 'id', example: 1, description: 'ID de la demande' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour.' })
  async updateDemandeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
    @Req() req: any, // 🔑 on récupère l’utilisateur courant via le token
  ) {
    return this.demandeAbsenceService.updateStatus(id, dto, req.user);
  }

  // 3️⃣ Liste des employés du service (et sous-services si direction)
  @Get(':managerId/employes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: "Obtenir la liste des employés du service et des sous-services si direction" })
  async getEmployes(@Param('managerId', ParseIntPipe) managerId: number, @Req() req: any,
@Body() body: any) {
    const currentManagerId = req.user.id;
    return this.employeService.findEquipeDuManager(currentManagerId);
  }
  
  // 4️⃣ Créer ou ajuster les plannings d'un ou plusieurs employés du service
  @Post(':managerId/plannings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: "Créer ou ajuster les plannings d'un ou plusieurs employés du service" })
  async createOrUpdatePlanning(@Param('managerId', ParseIntPipe) managerId: number, @Body() dto: CreatePlanningDto) {
    return this.planningService.createPlanning(dto, managerId);
  }
}

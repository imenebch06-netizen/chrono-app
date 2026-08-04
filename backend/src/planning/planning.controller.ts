import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PlanningService } from './planning.service';
import { CreatePlanningDto } from './dto/create-planning.dto';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnershipOrSameServiceGuard } from '../auth/guards/ownership-or-same-service.guard';
import { SameServiceGuard } from '../auth/guards/same-service.guard';

@ApiTags('Plannings')
@ApiBearerAuth() // 🔑 Indique à Swagger que ce contrôleur nécessite l'authentification JWT
@Controller('plannings')
export class PlanningController {
  constructor(private readonly service: PlanningService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER) // 🔑 Seuls les Admins et Managers peuvent créer/attribuer un planning
  @ApiOperation({ summary: 'Attribuer un planning / shift de travail à un employé' })
  @ApiResponse({ status: 201, description: 'Planning créé et attribué avec succès.' })
  @ApiResponse({ status: 400, description: "Données d'entrée invalides." })
  create(@Body() dto: CreatePlanningDto) {
    return this.service.create(dto);
  }

  @Get('employe/:employeId')
  @UseGuards(JwtAuthGuard, OwnershipOrSameServiceGuard) // 🔒 Propre profil, Manager du même service ou Admin
  @ApiOperation({ summary: "Consulter l'historique des plannings d'un employé" })
  @ApiParam({ name: 'employeId', example: 1, description: "ID de l'employé" })
  @ApiResponse({ status: 200, description: 'Historique des plannings récupéré.' })
  @ApiResponse({ status: 404, description: 'Employé introuvable.' })
  findByEmploye(@Param('employeId', ParseIntPipe) employeId: number) {
    return this.service.findByEmploye(employeId);
  }

  @Get('service/:serviceId')
  @UseGuards(JwtAuthGuard, RolesGuard, SameServiceGuard)
  @Roles(Role.ADMIN, Role.MANAGER) // 🔑 Accès réservé aux Admins et Managers du même service
  @ApiOperation({ summary: "Obtenir les plannings d'un service spécifique" })
  @ApiParam({ name: 'serviceId', example: 1, description: 'ID du service' })
  @ApiQuery({ name: 'dateDebut', required: false, example: '2026-08-01', description: 'Date de début de la plage' })
  @ApiQuery({ name: 'dateFin', required: false, example: '2026-08-31', description: 'Date de fin de la plage' })
  @ApiResponse({ status: 200, description: 'Plannings du service récupérés.' })
  async getPlanningsByService(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    return this.service.findByService(serviceId, dateDebut, dateFin);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER) // 🔑 Seuls les Admins et Managers peuvent supprimer un planning
  @ApiOperation({ summary: 'Supprimer un planning par son ID' })
  @ApiParam({ name: 'id', example: 1, description: 'ID du planning à supprimer' })
  @ApiResponse({ status: 200, description: 'Planning supprimé avec succès.' })
  @ApiResponse({ status: 404, description: 'Planning introuvable.' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
import { Controller, Post, Body, Get, Param, ParseIntPipe, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeService } from './employe.service';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { UpdateEmployeDto } from './dto/update-employe.dto';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OwnershipOrSameServiceGuard } from '../auth/guards/ownership-or-same-service.guard';
import { SameServiceGuard } from '../auth/guards/same-service.guard';

@ApiTags('Employés')
@ApiBearerAuth() // 🔑 Nécessaire pour Swagger
@Controller('employe')
export class EmployeController {
  constructor(private readonly employeService: EmployeService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // 🔑 Seul l'Admin crée un employé
  @ApiOperation({ summary: 'Créer un nouvel employé' })
  @ApiResponse({ status: 201, description: 'Employé créé avec succès.' })
  @ApiResponse({ status: 409, description: 'Cet email est déjà utilisé.' })
  create(@Body() createEmployeDto: CreateEmployeDto) {
    return this.employeService.create(createEmployeDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard) // 🔒 Ajout de RolesGuard qui manquait !
  @Roles(Role.ADMIN, Role.MANAGER) // 🔑 Vue globale réservée aux Admins et Managers
  @ApiOperation({ summary: 'Obtenir la liste de tous les employés' })
  @ApiResponse({ status: 200, description: 'Liste récupérée avec succès.' })
  findAll() {
    return this.employeService.findAll();
  }

  // ⚠️ CETTE ROUTE DOIT ÊTRE PLACÉE AVANT ':id' POUR ÉVITER LA COLLISION DE ROUTE
  @Get('service/:serviceId')
  @UseGuards(JwtAuthGuard, RolesGuard, SameServiceGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Obtenir tous les employés d'un service spécifique" })
  @ApiParam({ name: 'serviceId', example: 1, description: 'ID du service' })
  @ApiResponse({ status: 200, description: 'Liste des employés du service récupérée.' })
  @ApiResponse({ status: 404, description: 'Service introuvable.' })
  getEmployesByService(@Param('serviceId', ParseIntPipe) serviceId: number) {
    return this.employeService.findByService(serviceId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, OwnershipOrSameServiceGuard) // 🔒 Propre profil, Manager du même service ou Admin
  @ApiOperation({ summary: 'Obtenir un employé par son ID' })
  @ApiParam({ name: 'id', example: 1, description: "ID de l'employé" })
  @ApiResponse({ status: 200, description: 'Employé trouvé.' })
  @ApiResponse({ status: 404, description: 'Employé introuvable.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // 🔑 Seul l'Admin modifie la fiche d'un employé
  @ApiOperation({ summary: "Mettre à jour les informations d'un employé" })
  @ApiParam({ name: 'id', example: 1, description: "ID de l'employé" })
  @ApiResponse({ status: 200, description: 'Employé mis à jour.' })
  @ApiResponse({ status: 404, description: 'Employé introuvable.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateEmployeDto: UpdateEmployeDto) {
    return this.employeService.update(id, updateEmployeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // 🔑 Seul l'Admin peut supprimer
  @ApiOperation({ summary: 'Supprimer un employé' })
  @ApiParam({ name: 'id', example: 1, description: "ID de l'employé" })
  @ApiResponse({ status: 200, description: 'Employé supprimé.' })
  @ApiResponse({ status: 404, description: 'Employé introuvable.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeService.remove(id);
  }
  @Get('mon-equipe')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MANAGER, Role.ADMIN)
@ApiOperation({ summary: 'Obtenir la liste de ses subordonnés et des employés de son service' })
async getMonEquipe(@Req() req: any) {
  return this.employeService.findEquipeDuManager(req.user.id, req.user.serviceId);
}

}
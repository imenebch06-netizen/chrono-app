import { BadRequestException, Controller, Delete, Get, Post, Query, UploadedFile, UseGuards, UseInterceptors,
  Body, Param, ParseIntPipe, 
  Patch} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmployeService } from '../employe/employe.service';
import { ServicesService } from '../service/service.service';
import { DirectionsService } from '../direction/direction.service';
import { CreateEmployeDto } from '../employe/dto/create-employe.dto';
import { UpdateEmployeDto } from '../employe/dto/update-employe.dto';
import { CreateServiceDto } from '../service/dto/create-service.dto';
import { UpdateServiceDto } from '../service/dto/update-service.dto';
import { CreateDirectionDto } from '../direction/dto/create-direction.dto';
import { UpdateDirectionDto } from '../direction/dto/update-direction.dto';
@Controller('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // 🔒 Protection par JWT et vérification des rôles
@Roles(Role.ADMIN) // Seul un utilisateur avec le rôle ADMIN peut y accéder
export class AdminController {
  pointageService: any;
  constructor(private readonly adminService: AdminService,
    private readonly employeService: EmployeService,
    private readonly servicesService: ServicesService,
    private readonly directionsService: DirectionsService,
  ) {}

  /**
   * GET /api/admin/stats
   * Récupère la répartition globale des employés (présents, congés, repos, récup, absents)
   * et le nombre de demandes en attente.
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard) // 🔒 Protection par JWT et vérification des rôles
  @Roles(Role.ADMIN) // Seul un utilisateur avec le rôle ADMIN peut y accéder
  @ApiOperation({ summary: 'Obtenir les statistiques globales du système' })
  async getStats() {
    return this.adminService.getGlobalStats();
  }

  @Get('alerts')
  @UseGuards(JwtAuthGuard, RolesGuard) // 🔒 Protection par JWT et vérification des rôles
  @Roles(Role.ADMIN) // Seul un utilisateur avec le rôle ADMIN peut y accéder
  @ApiOperation({ summary: 'Obtenir la liste des retards des employés' })
  async getRetards() {
    return this.adminService.getRetardsAdmin();
  }

  @Get('pending-demandes')
  @UseGuards(JwtAuthGuard, RolesGuard) // 🔒 Protection par JWT et vérification des rôles
  @Roles(Role.ADMIN) // Seul un utilisateur avec le rôle ADMIN peut y accéder
  @ApiOperation({ summary: 'Obtenir la liste des demandes en attente' })
  async getPendingDemandes() {
    return this.adminService.findAllPendingForAdmin();
  }


    @Post('import-excel')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN) // 🔑 Autorisé aux Admins et Managers
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Importer des pointages depuis un fichier Excel' })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: { type: 'string', format: 'binary' },
        },
      },
    })
    @ApiResponse({ status: 201, description: 'Importation réussie.' })
    @ApiResponse({ status: 400, description: 'Fichier manquant ou format invalide.' })
    async importerExcel(@UploadedFile() file: Express.Multer.File) {
      if (!file) {
        throw new BadRequestException('Veuillez fournir un fichier Excel (.xlsx ou .xls).');
      }
      return this.pointageService.importerPointagesDepuisExcel(file.buffer);
    }

    // ---------------- EMPLOYES ----------------
  @Post('employes')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Créer un nouvel employé' })
  createEmploye(@Body() dto: CreateEmployeDto) {
    return this.employeService.create(dto);
  }

  @Get('employes')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lister tous les employés' })
  findAllEmployes() {
    return this.employeService.findAll();
  }

  @Get('employes/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtenir un employé par ID' })
  findOneEmploye(@Param('id', ParseIntPipe) id: number) {
    return this.employeService.findOne(id);
  }

  @Patch('employes/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un employé' })
  updateEmploye(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEmployeDto) {
    return this.employeService.update(id, dto);
  }

  @Delete('employes/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Supprimer un employé' })
  removeEmploye(@Param('id', ParseIntPipe) id: number) {
    return this.employeService.remove(id);
  }

  // ---------------- SERVICES ----------------
  @Post('services')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Créer un service' })
  createService(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get('services')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lister tous les services' })
  findAllServices() {
    return this.servicesService.findAll();
  }

  @Get('services/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtenir un service par ID' })
  findOneService(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOne(id);
  }

  @Patch('services/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un service' })
  updateService(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete('services/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Supprimer un service' })
  removeService(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.remove(id);
  }

  // ---------------- DIRECTIONS ----------------
  @Post('directions')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Créer une direction' })
  createDirection(@Body() dto: CreateDirectionDto) {
    return this.directionsService.create(dto);
  }

  @Get('directions')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lister toutes les directions' })
  findAllDirections() {
    return this.directionsService.findAll();
  }

  @Get('directions/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtenir une direction par ID' })
  findOneDirection(@Param('id', ParseIntPipe) id: number) {
    return this.directionsService.findOne(id);
  }

  @Patch('directions/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour une direction' })
  updateDirection(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDirectionDto) {
    return this.directionsService.update(id, dto);
  }

  @Delete('directions/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Supprimer une direction' })
  removeDirection(@Param('id', ParseIntPipe) id: number) {
    return this.directionsService.remove(id);
  }
}

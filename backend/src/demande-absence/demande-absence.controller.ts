import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DemandeAbsenceService } from './demande-absence.service';
import { CreateDemandeAbsenceDto } from './dto/create-demande-absence.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OwnershipOrSameServiceGuard } from '../auth/guards/ownership-or-same-service.guard';
import { SameServiceGuard } from '../auth/guards/same-service.guard';

@ApiTags("Demandes d'Absence")
@ApiBearerAuth() // 🔑 Requis pour authentifier les requêtes dans Swagger
@Controller('demandes-absence')
export class DemandeAbsenceController {
  constructor(private readonly service: DemandeAbsenceService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // 🔒 L'utilisateur connecté formule sa demande
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('justificatif'))
  @ApiOperation({ summary: "Créer une demande d'absence avec pièce jointe (Cloudinary)" })
  @ApiResponse({ status: 201, description: 'Demande créée et image téléversée sur Cloudinary.' })
  @ApiResponse({ status: 400, description: 'Données invalides ou erreur de téléversement.' })
  create(
    @Body() dto: CreateDemandeAbsenceDto,
    @Req() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.create(dto, req.user, file);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // 🔑 Vue globale entreprise réservée à l'ADMIN
  @ApiOperation({ summary: 'Obtenir la liste de toutes les demandes (Admin)' })
  @ApiResponse({ status: 200, description: 'Liste globale récupérée.' })
  findAll() {
    return this.service.findAll();
  }

  // ⚠️ ROUTES SPÉCIFIQUES PLACÉES AVANT ':id' POUR ÉVITER LES COLLISIONS DE ROUTE

  @Get('managers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // 🔑 Strictement réservé à l'ADMIN
  @ApiOperation({ summary: 'Obtenir les demandes de tous les managers' })
  @ApiResponse({ status: 200, description: 'Demandes des managers récupérées.' })
  getDemandesManagers() {
    return this.service.findDemandesManagers();
  }

  @Get('service/:serviceId')
  @UseGuards(JwtAuthGuard, RolesGuard, SameServiceGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Obtenir les demandes d'un service spécifique" })
  @ApiParam({ name: 'serviceId', example: 1, description: 'ID du service' })
  @ApiResponse({ status: 200, description: 'Demandes du service récupérées.' })
  getDemandesByService(@Param('serviceId', ParseIntPipe) serviceId: number) {
    return this.service.findByService(serviceId);
  }

  @Get('employe/:employeId')
  @UseGuards(JwtAuthGuard, OwnershipOrSameServiceGuard) // 🔒 Propre profil, Manager du même service ou Admin
  @ApiOperation({ summary: "Obtenir les demandes d'un employé spécifique" })
  @ApiParam({ name: 'employeId', example: 1, description: "ID de l'employé" })
  @ApiResponse({ status: 200, description: 'Demandes de l employé récupérées.' })
  findByEmploye(@Param('employeId', ParseIntPipe) employeId: number) {
    return this.service.findByEmploye(employeId);
  }

  // ⚠️ ROUTES AVEC ID DYNAMIQUE

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Obtenir les détails d'une demande" })
  @ApiParam({ name: 'id', example: 1, description: 'ID de la demande' })
  @ApiResponse({ status: 200, description: 'Détails de la demande trouvés.' })
  @ApiResponse({ status: 404, description: 'Demande introuvable.' })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.service.findOne(id, req.user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER) // 🔑 Validation réservée aux Managers et Admins
  @ApiOperation({ summary: 'Changer le statut (VALIDE / REFUSE)' })
  @ApiParam({ name: 'id', example: 1, description: 'ID de la demande' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour.' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
    @Req() req: any,
  ) {
    // La logique interne du service s'assurera aussi qu'un Manager ne valide PAS un autre Manager !
    return this.service.updateStatus(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // 🔑 Suppression réservée aux Managers et Admins
  @ApiOperation({ summary: 'Supprimer une demande' })
  @ApiParam({ name: 'id', example: 1, description: 'ID de la demande' })
  @ApiResponse({ status: 200, description: 'Demande supprimée.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

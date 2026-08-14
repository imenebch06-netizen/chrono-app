import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';

import { DemandeAbsenceService } from './demande-absence.service';
import { CreateDemandeAbsenceDto } from './dto/create-demande-absence.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorator/current-user.decorator'; // Ajuste le chemin au besoin
@ApiTags('Demandes d\'Absence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('demandes-absence')
export class DemandeAbsenceController {
  constructor(private readonly demandeAbsenceService: DemandeAbsenceService) {}

  // =========================================================================
  // 1. CRÉATION & ESPACE PERSONNEL
  // =========================================================================

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Créer une demande d\'absence (Employé / Manager)',
    description: 'Permet à tout employé de créer une demande avec ou sans fichier justificatif. Les administrateurs ne peuvent pas soumettre de demande.',
  })
  @ApiResponse({ status: 201, description: 'Demande créée avec succès.' })
  @ApiResponse({ status: 400, description: 'Données invalides ou champs obligatoires manquants.' })
  @ApiResponse({ status: 403, description: 'Les administrateurs ne peuvent pas créer de demande.' })
  async create(
    @Body() dto: CreateDemandeAbsenceDto,
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
   console.log('--- USER EXTRAIT DU TOKEN JWT ---', user);
    return this.demandeAbsenceService.create(dto, user, file);
  }

  @Get('mes-demandes')
  @ApiOperation({
    summary: 'Obtenir l\'historique des demandes de l\'utilisateur connecté',
  })
  @ApiResponse({ status: 200, description: 'Liste des demandes de l\'utilisateur connecté.' })
  async findMyDemandes(@CurrentUser() user: any) {
    const userId = Number(user.id ?? user.sub);
    return this.demandeAbsenceService.findByEmploye(userId);
  }

  @Delete('mes-demandes/:id/annuler')
  @ApiOperation({
    summary: 'Annuler sa propre demande d\'absence',
    description: 'L\'employé peut annuler uniquement sa propre demande et seulement si son statut est encore EN_ATTENTE.',
  })
  @ApiParam({ name: 'id', description: 'ID de la demande à annuler', type: Number })
  @ApiResponse({ status: 200, description: 'Demande annulée avec succès.' })
  @ApiResponse({ status: 400, description: 'Impossible d\'annuler une demande déjà traitée.' })
  @ApiResponse({ status: 403, description: 'Tentative d\'annulation de la demande d\'un autre utilisateur.' })
  async cancelOwnDemande(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const userId = Number(user.id ?? user.sub);
    return this.demandeAbsenceService.cancelOwnDemande(id, userId);
  }

  // =========================================================================
  // 2. WORKFLOW VALIDATION MANAGER & ADMIN
  // =========================================================================

  @Get('en-attente/mon-equipe')
  @Roles('MANAGER')
  @ApiOperation({
    summary: 'Obtenir les demandes en attente de son équipe (Manager)',
    description: 'Retourne toutes les demandes EN_ATTENTE des employés appartenant à la branche hiérarchique du Manager.',
  })
  @ApiResponse({ status: 200, description: 'Liste des demandes en attente pour le manager.' })
  @ApiResponse({ status: 403, description: 'Accès réservé aux responsables d\'organisation.' })
  async getPendingForMyTeam(@CurrentUser() user: any) {
    const userId = Number(user.id ?? user.sub);
    return this.demandeAbsenceService.findPendingForManager(userId);
  }

  @Get('en-attente')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Obtenir TOUTES les demandes en attente de l\'entreprise (Admin)',
  })
  @ApiResponse({ status: 200, description: 'Liste globale des demandes en attente.' })
  @ApiResponse({ status: 403, description: 'Accès réservé aux Administrateurs.' })
  async getAllPending() {
    return this.demandeAbsenceService.findAllPending();
  }

  @Patch(':id/statut')
  @Roles('MANAGER', Role.ADMIN)
  @ApiOperation({
    summary: 'Valider ou Refuser une demande d\'absence (Manager / Admin)',
    description: 'Met à jour le statut (VALIDE / REFUSE). Si validé, met automatiquement à jour le compteur de solde de l\'employé.',
  })
  @ApiParam({ name: 'id', description: 'ID de la demande', type: Number })
  @ApiResponse({ status: 200, description: 'Statut mis à jour et solde déduit si validé.' })
  @ApiResponse({ status: 403, description: 'Droits insuffisants ou tentative d\'auto-validation.' })
  @ApiResponse({ status: 404, description: 'Demande non trouvée.' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.demandeAbsenceService.updateStatus(id, dto, user);
  }

  // =========================================================================
  // 3. CONSULTATION DÉTAILLÉE & ADMINISTRATION GLOBALE
  // =========================================================================

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Obtenir toutes les demandes de l\'entreprise (Admin)',
  })
  @ApiResponse({ status: 200, description: 'Liste complète de toutes les demandes.' })
  async findAll() {
    return this.demandeAbsenceService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir le détail d\'une demande d\'absence',
    description: 'Accessible par le demandeur lui-même, son Manager hiérarchique, ou un Admin.',
  })
  @ApiParam({ name: 'id', description: 'ID de la demande', type: Number })
  @ApiResponse({ status: 200, description: 'Détails de la demande.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Demande non trouvée.' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.demandeAbsenceService.findOne(id, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Supprimer définitivement une demande (Admin)',
  })
  @ApiParam({ name: 'id', description: 'ID de la demande à supprimer', type: Number })
  @ApiResponse({ status: 200, description: 'Demande supprimée de la BDD.' })
  @ApiResponse({ status: 404, description: 'Demande introuvable.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.demandeAbsenceService.remove(id);
  }
}
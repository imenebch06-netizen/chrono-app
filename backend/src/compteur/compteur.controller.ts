import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import express from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CompteurService } from './compteur.service';
import { UpdateCompteurDto } from './dto/update-compteur.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Compteurs & Soldes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('compteurs')
export class CompteurController {
  constructor(private readonly compteurService: CompteurService) {}

  @Get('mon-compteur')

  @Roles('MANAGER')
  @ApiOperation({ summary: "Obtenir les soldes du compteur de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: 'Soldes du compteur récupérés avec succès.' })
  @ApiResponse({ status: 401, description: 'Non authentifié.' })
  getMonCompteur(@Req() req: express.Request) {
    const userId = (req as any).user.id;
    return this.compteurService.getByEmploye(userId);
  }

  @Get('employe/:employeId')
  @ApiOperation({ summary: "Obtenir les soldes du compteur d'un employé spécifique" })
  @ApiParam({ name: 'employeId', example: 1, description: "ID de l'employé" })
  @ApiResponse({ status: 200, description: 'Soldes du compteur récupérés avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé.' })
  @ApiResponse({ status: 404, description: 'Employé introuvable.' })
  getByEmploye(@Param('employeId', ParseIntPipe) employeId: number) {
    return this.compteurService.getByEmploye(employeId);
  }

  @Patch('employe/:employeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Ajuster manuellement les soldes d'un employé (RH / Admin)" })
  @ApiParam({ name: 'employeId', example: 1, description: "ID de l'employé" })
  @ApiResponse({ status: 200, description: 'Compteur mis à jour avec succès.' })
  @ApiResponse({ status: 403, description: 'Accès interdit (Rôle Admin requis).' })
  @ApiResponse({ status: 404, description: 'Employé introuvable.' })
  update(
    @Param('employeId', ParseIntPipe) employeId: number,
    @Body() dto: UpdateCompteurDto,
  ) {
    return this.compteurService.updateCompteur(employeId, dto);
  }


  @Post('cloture-mensuelle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'FORCER MANUELLEMENT la remise à zéro du crédit/débit mensuel',
  })
  @ApiResponse({ status: 200, description: 'Clôture mensuelle du crédit/débit effectuée.' })
  @ApiResponse({ status: 403, description: 'Accès interdit (Rôle Admin requis).' })
  forcerClotureMensuelle() {
    return this.compteurService.reinitialiserCreditDebitMensuel();
  }

  @Post('attribution-conges')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: "FORCER MANUELLEMENT l'attribution mensuelle de congés (+2.08 jours)",
  })
  @ApiResponse({ status: 200, description: 'Attribution mensuelle de congés effectuée.' })
  @ApiResponse({ status: 403, description: 'Accès interdit (Rôle Admin requis).' })
  forcerAttributionConges() {
    return this.compteurService.attributionMensuelleConges();
  }

  @Post('raz-rtt-annuelle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'FORCER MANUELLEMENT la remise à zéro annuelle des RTT' })
  @ApiResponse({ status: 200, description: 'Remise à zéro des RTT effectuée.' })
  @ApiResponse({ status: 403, description: 'Accès interdit (Rôle Admin requis).' })
  forcerRazRtt() {
    return this.compteurService.reinitialiserRttAnnuel();
  }
}
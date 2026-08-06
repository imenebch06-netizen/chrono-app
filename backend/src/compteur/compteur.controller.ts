import { Controller, Get, Patch, Post, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CompteurService } from './compteur.service';
import { UpdateCompteurDto } from './dto/update-compteur.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnershipOrSameServiceGuard } from '../auth/guards/ownership-or-same-service.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Compteur & Gestion des Soldes')
@ApiBearerAuth() // 🔑 Indique à Swagger que ce contrôleur nécessite l'authentification JWT
@Controller('compteurs')
export class CompteurController {
  constructor(private readonly service: CompteurService) {}

  @Get('employe/:employeId')
  @UseGuards(JwtAuthGuard, OwnershipOrSameServiceGuard) // 🔒 Propre profil, Manager du même service ou Admin
  @ApiOperation({ summary: "Obtenir les soldes du compteur d'un employé" })
  @ApiParam({ name: 'employeId', example: 1, description: "ID de l'employé" })
  @ApiResponse({ status: 200, description: 'Soldes du compteur récupérés avec succès.' })
  @ApiResponse({ status: 404, description: 'Employé introuvable.' })
  getByEmploye(@Param('employeId', ParseIntPipe) employeId: number) {
    return this.service.getByEmploye(employeId);
  }

  @Patch('employe/:employeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // 🔑 Seul l'Admin peut ajuster manuellement les soldes
  @ApiOperation({ summary: "Ajuster manuellement les soldes d'un employé (RH / Admin)" })
  @ApiParam({ name: 'employeId', example: 1, description: "ID de l'employé" })
  @ApiResponse({ status: 200, description: 'Compteur mis à jour avec succès.' })
  @ApiResponse({ status: 404, description: 'Employé introuvable.' })
  update(@Param('employeId', ParseIntPipe) employeId: number, @Body() dto: UpdateCompteurDto) {
    return this.service.updateCompteur(employeId, dto);
  }

  @Post('cloture-mensuelle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // 🔑 Action globale réservée strictement à l'Admin
  @ApiOperation({
    summary:
      'FORCER MANUELLEMENT la clôture mensuelle (Convertit crédit en RTT et remet le crédit/débit à 0)',
  })
  @ApiResponse({ status: 200, description: 'Clôture mensuelle effectuée avec succès.' })
  forcerClotureMensuelle() {
    return this.service.reinitialiserCreditDebitMensuel();
  }

  @Post('attribution-conges')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // 🔑 Action globale réservée strictement à l'Admin
  @ApiOperation({ summary: "FORCER MANUELLEMENT l'attribution mensuelle de congés (+2.08 jours)" })
  @ApiResponse({ status: 200, description: 'Attribution mensuelle de congés effectuée.' })
  forcerAttributionConges() {
    return this.service.attributionMensuelleConges();
  }

  @Post('raz-rtt-annuelle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // 🔑 Action globale réservée strictement à l'Admin
  @ApiOperation({ summary: 'FORCER MANUELLEMENT la remise à zéro annuelle des RTT' })
  @ApiResponse({ status: 200, description: 'Remise à zéro des RTT effectuée.' })
  forcerRazRtt() {
    return this.service.reinitialiserRttAnnuel();
  }
}

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PointageService } from './pointage.service';
import { OwnershipOrSameServiceGuard } from '../auth/guards/ownership-or-same-service.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Pointages')
@ApiBearerAuth() // 🔑 Nécessaire pour authentifier la requête dans Swagger
@Controller('pointages')
export class PointageController {
  constructor(private readonly pointageService: PointageService) {}

  // ---------------------------------------------------------------------------
  // 1. ROUTES STATIQUES (à placer impérativement en premier)
  // ---------------------------------------------------------------------------

  @Post('import-excel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN,) // 🔑 Autorisé aux Admins et Managers
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

  @Get('date/employes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // 🔑 Reservé aux Admins et Managers
  @ApiOperation({ summary: 'Obtenir les pointages de tous les employés pour une date donnée' })
  @ApiQuery({ name: 'date', example: '2026-07-26' })
  @ApiResponse({ status: 200, description: 'Liste des pointages du jour récupérée.' })
  async getEmployesByDate(@Query('date') date: string) {
    return this.pointageService.getEmployesByDate(date);
  }

  @Get('tableau-bord-journee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // 🔑 Réservé aux Admins et Managers
  @ApiOperation({ summary: 'Obtenir le tableau de bord résumé de la journée' })
  @ApiQuery({ name: 'date', example: '2026-07-26' })
  @ApiResponse({ status: 200, description: 'Tableau de bord généré avec succès.' })
  async getTableauDeBordJournee(@Query('date') date: string) {
    return this.pointageService.getTableauDeBordJournee(date);
  }

  @Delete('delete-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // 🔑 Action critique strictement réservée à l'ADMIN
  @ApiOperation({ summary: 'Supprimer tous les pointages (Purge)' })
  @ApiResponse({ status: 200, description: 'Tous les pointages ont été supprimés.' })
  async deleteAllPointages() {
    await this.pointageService.deleteAllPointages();
    return { message: 'Tous les pointages ont été supprimés avec succès.' };
  }

  // ---------------------------------------------------------------------------
  // 2. ROUTES DYNAMIQUES (avec paramètres dans l'URL)
  // ---------------------------------------------------------------------------

  @Get('semaine/:employeId')
  @UseGuards(JwtAuthGuard, OwnershipOrSameServiceGuard) // 🔒 Propre profil, Manager du même service ou Admin
  @ApiOperation({ summary: "Obtenir les pointages d'une semaine pour un employé" })
  @ApiParam({ name: 'employeId', example: 1, description: "ID de l'employé" })
  @ApiQuery({ name: 'dateDebut', example: '2026-07-25' })
  @ApiResponse({ status: 200, description: 'Pointages hebdomadaires récupérés.' })
  async getSemaine(
    @Param('employeId', ParseIntPipe) employeId: number,
    @Query('dateDebut') dateDebut: string,
  ) {
    return this.pointageService.getSemaineEmploye(employeId, dateDebut);
  }
}
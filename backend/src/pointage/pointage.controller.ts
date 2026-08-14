import {
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Req, // 👈 Import de @Req
} from '@nestjs/common';
import type { Request } from 'express'; // 👈 Import du type Express Request
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiProperty,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PointageService } from './pointage.service';

// 🛡️ Vos Guards, Décorateurs et Enums
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/role.enum';

class ImportExcelDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Fichier Excel (.xlsx ou .xls)',
  })
  file: any;
}

@ApiTags('Pointages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pointages')
export class PointageController {
  constructor(private readonly pointageService: PointageService) {}

  // =========================================================================
  // 1. IMPORTATION DES POINTAGES (ADMIN UNIQUEMENT)
  // =========================================================================
  @Post('import')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Importer des pointages depuis Excel (Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ImportExcelDto })
  @ApiResponse({ status: 201, description: 'Importation réussie.' })
  @UseInterceptors(FileInterceptor('file'))
  async importerPointages(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Veuillez fournir un fichier Excel.');
    }
    return this.pointageService.importerPointagesDepuisExcel(file.buffer);
  }

  // =========================================================================
  // 2. POINTAGES DU JOUR POUR TOUTE LA BOÎTE (ADMIN UNIQUEMENT)
  // =========================================================================
  @Get('date')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtenir tous les pointages pour une date (Admin)' })
  @ApiQuery({ name: 'date', required: true, example: '2026-08-10' })
  @ApiResponse({ status: 200, description: 'Pointages globaux récupérés.' })
  async getPointagesParDate(@Query('date') date: string) {
    return this.pointageService.getPointagesParDate(date);
  }

  // =========================================================================
  // 3. MES PROPRES POINTAGES DE LA SEMAINE (@Req)
  // =========================================================================
  @Get('ma-semaine')
  @Roles(Role.EMPLOYE, 'MANAGER', Role.ADMIN)
  @ApiOperation({ summary: 'Obtenir ma vue semaine (Utilisateur connecté via JWT)' })
  @ApiQuery({ name: 'dateDebut', required: true, example: '2026-08-10' })
  @ApiResponse({ status: 200, description: 'Semaine de l’utilisateur récupérée.' })
  async getMaSemaine(
    @Req() req: Request, // 👈 Récupère la requête HTTP
    @Query('dateDebut') dateDebut: string,
  ) {
    // ID extrait de req.user (remplace .id par .userId ou .sub selon le payload de ton JWT)
    const userId = (req as any).user.id;
    return this.pointageService.getSemaineEmploye(userId, dateDebut);
  }

  // =========================================================================
  // 4. POINTAGES DE MON ÉQUIPE (@Req)
  // =========================================================================
  @Get('mon-equipe')
  @Roles('MANAGER', Role.ADMIN)
  @ApiOperation({ summary: 'Obtenir les pointages de mon équipe pour une date (Chef connecté via JWT)' })
  @ApiQuery({ name: 'date', required: true, example: '2026-08-10' })
  @ApiResponse({ status: 200, description: 'Pointages de l’équipe récupérés.' })
  async getMonEquipe(
    @Req() req: Request, // 👈 Récupère la requête HTTP
    @Query('date') date: string,
  ) {
    // ID du chef connecté extrait de req.user
    const chefId = (req as any).user.id;
    return this.pointageService.getPointagesEquipeParChef(chefId, date);
  }
}
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

@ApiTags("Demandes d'Absence")
@Controller('demandes-absence')
export class DemandeAbsenceController {
  constructor(private readonly service: DemandeAbsenceService) {}

  @Post()
  @ApiConsumes('multipart/form-data') // 👈 Déclare le formulaire multipart dans Swagger
  @UseInterceptors(FileInterceptor('justificatif')) // 👈 Intercepte le fichier sous le champ 'justificatif'
  @ApiOperation({ summary: "Créer une demande d'absence avec pièce jointe (Cloudinary)" })
  @ApiResponse({ status: 201, description: 'Demande créée et image téléversée sur Cloudinary.' })
  @ApiResponse({ status: 400, description: 'Données invalides ou erreur de téléversement.' })
  create(
    @Body() dto: CreateDemandeAbsenceDto,
    @UploadedFile() file?: Express.Multer.File, // 👈 Récupère le fichier
  ) {
    return this.service.create(dto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir la liste de toutes les demandes' })
  findAll() {
    return this.service.findAll();
  }

  @Get('employe/:employeId')
  @ApiOperation({ summary: "Obtenir les demandes d'un employé spécifique" })
  @ApiParam({ name: 'employeId', example: 1 })
  findByEmploye(@Param('employeId', ParseIntPipe) employeId: number) {
    return this.service.findByEmploye(employeId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Obtenir les détails d'une demande" })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Changer le statut (VALIDE / REFUSE)' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une demande' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

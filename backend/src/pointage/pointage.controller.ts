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
} from '@nestjs/common';
import { ApiConsumes, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PointageService } from './pointage.service';

@ApiTags('Pointages')
@Controller('pointages')
export class PointageController {
  constructor(private readonly pointageService: PointageService) {}

  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async importerExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Veuillez fournir un fichier Excel (.xlsx ou .xls).');
    }
    return this.pointageService.importerPointagesDepuisExcel(file.buffer);
  }

  // 🔴 ROUTE STATIQUE EN PREMIER
  @Get('date/employes')
  @ApiQuery({ name: 'date', example: '2026-07-26' })
  async getEmployesByDate(@Query('date') date: string) {
    return this.pointageService.getEmployesByDate(date);
  }

  // 🟢 ROUTE AVEC PARAMÈTRE EN SECOND
  @Get('semaine/:employeId')
  @ApiQuery({ name: 'dateDebut', example: '2026-07-25' })
  async getSemaine(
    @Param('employeId', ParseIntPipe) employeId: number,
    @Query('dateDebut') dateDebut: string,
  ) {
    return this.pointageService.getSemaineEmploye(employeId, dateDebut);
  }
   @Get('tableau-bord-journee')
  @ApiQuery({ name: 'date', example: '2026-07-26' })
  async getTableauDeBordJournee(@Query('date') date: string) {
    return this.pointageService.getTableauDeBordJournee(date);
  }
}
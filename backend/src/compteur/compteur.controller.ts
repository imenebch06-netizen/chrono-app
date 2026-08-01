import { Controller, Get, Patch, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CompteurService } from './compteur.service';
import { UpdateCompteurDto } from './dto/update-compteur.dto';

@ApiTags('Compteur & Gestion des Soldes')
@Controller('compteurs')
export class CompteurController {
  constructor(private readonly service: CompteurService) {}

  @Get('employe/:employeId')
  @ApiOperation({ summary: "Obtenir les soldes du compteur d'un employé" })
  getByEmploye(@Param('employeId', ParseIntPipe) employeId: number) {
    return this.service.getByEmploye(employeId);
  }

  @Patch('employe/:employeId')
  @ApiOperation({ summary: "Ajuster manuellement les soldes d'un employé (RH / Admin)" })
  update(@Param('employeId', ParseIntPipe) employeId: number, @Body() dto: UpdateCompteurDto) {
    return this.service.updateCompteur(employeId, dto);
  }

  @Post('cloture-mensuelle')
  @ApiOperation({
    summary:
      'FORCER MANUELLEMENT la clôture mensuelle (Convertit crédit en RTT et remet le crédit/débit à 0)',
  })
  forcerClotureMensuelle() {
    return this.service.reinitialiserCreditDebitMensuel();
  }

  @Post('attribution-conges')
  @ApiOperation({ summary: "FORCER MANUELLEMENT l'attribution mensuelle de congés (+2.08 jours)" })
  forcerAttributionConges() {
    return this.service.attributionMensuelleConges();
  }

  @Post('raz-rtt-annuelle')
  @ApiOperation({ summary: 'FORCER MANUELLEMENT la remise à zéro annuelle des RTT' })
  forcerRazRtt() {
    return this.service.reinitialiserRttAnnuel();
  }
}

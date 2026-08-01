import { Controller, Post, Body, Get, Param, ParseIntPipe, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlanningService } from './planning.service';
import { CreatePlanningDto } from './dto/create-planning.dto';

@ApiTags('Plannings')
@Controller('plannings')
export class PlanningController {
  constructor(private readonly service: PlanningService) {}

  @Post()
  @ApiOperation({ summary: 'Attribuer un planning / shift de travail à un employé' })
  create(@Body() dto: CreatePlanningDto) {
    return this.service.create(dto);
  }

  @Get('employe/:employeId')
  @ApiOperation({ summary: "Consulter l'historique des plannings d'un employé" })
  findByEmploye(@Param('employeId', ParseIntPipe) employeId: number) {
    return this.service.findByEmploye(employeId);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un planning par son ID' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}

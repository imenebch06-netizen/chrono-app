import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

import { PlanningService } from './planning.service';
import { CreatePlanningDto } from './dto/create-planning.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorator/current-user.decorator';

@ApiTags('Plannings & Horaires')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('planning')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Post()
  @Roles('MANAGER', Role.ADMIN)
  @ApiOperation({
    summary: 'Créer/Assigner un planning (Manager / Admin)',
    description:
      'Permet d\'assigner un planning à un ou plusieurs employés. Les managers ne peuvent assigner un planning qu\'aux employés situés sous leur branche hiérarchique.',
  })
  @ApiResponse({ status: 201, description: 'Planning créé avec succès.' })
  @ApiResponse({ status: 400, description: 'Données invalides ou liste d\'employés vide.' })
  @ApiResponse({ status: 403, description: 'Tentative d\'assignation hors de la branche du Manager.' })
  async create(
    @Body() dto: CreatePlanningDto,
    @CurrentUser() user: any,
  ) {
    return this.planningService.create(dto, user);
  }

  @Get('mon-planning')
  @ApiOperation({
    summary: 'Consulter son planning personnel',
  })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-08-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-08-31' })
  async findMyPlanning(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = Number(user.id ?? user.sub);
    return this.planningService.findMyPlanning(userId, startDate, endDate);
  }

  @Get('mon-equipe')
  @Roles('MANAGER')
  @ApiOperation({
    summary: 'Consulter le planning de son équipe (Manager)',
    description: 'Retourne le planning de tous les membres sous la responsabilité du Manager.',
  })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-08-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-08-31' })
  async findTeamPlanning(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = Number(user.id ?? user.sub);
    return this.planningService.findTeamPlanning(userId, startDate, endDate);
  }

  @Get('global')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Consulter tout le planning de l\'entreprise (Admin)',
  })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-08-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-08-31' })
  @ApiQuery({ name: 'organizationId', required: false, type: Number })
  async findAllPlanning(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('organizationId') organizationId?: number,
  ) {
    return this.planningService.findAllPlanning(startDate, endDate, organizationId ? Number(organizationId) : undefined);
  }

  @Delete(':id')
  @Roles('MANAGER', Role.ADMIN)
  @ApiOperation({
    summary: 'Supprimer un planning',
  })
  @ApiParam({ name: 'id', description: 'ID du planning', type: Number })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.planningService.remove(id, user);
  }
}
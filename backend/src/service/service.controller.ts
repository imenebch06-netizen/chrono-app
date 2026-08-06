import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Services')
@ApiBearerAuth() // 🔑 Indique à Swagger que ce contrôleur nécessite le JWT
@UseGuards(JwtAuthGuard, RolesGuard) // 🔒 Sécurise l'ensemble des routes du contrôleur
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles(Role.ADMIN) // 🔑 Réservé aux ADMINS
  @ApiOperation({ summary: 'Créer un nouveau service' })
  @ApiResponse({ status: 201, description: 'Le service a été créé avec succès.' })
  @ApiResponse({ status: 400, description: "Données d'entrée invalides." })
  @ApiResponse({ status: 404, description: 'Direction associée non trouvée.' })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  // 🔓 Accessible par tout utilisateur authentifié (pas de restriction @Roles)
  @ApiOperation({ summary: 'Récupérer la liste de tous les services' })
  @ApiResponse({ status: 200, description: 'Liste des services récupérée.' })
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(':id')
  // 🔓 Accessible par tout utilisateur authentifié
  @ApiOperation({ summary: 'Récupérer un service par son ID' })
  @ApiParam({ name: 'id', description: 'ID du service', example: 1 })
  @ApiResponse({ status: 200, description: 'Détails du service trouvés.' })
  @ApiResponse({ status: 404, description: 'Service introuvable.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN) // 🔑 Réservé aux ADMINS
  @ApiOperation({ summary: 'Mettre à jour un service existant' })
  @ApiParam({ name: 'id', description: 'ID du service à modifier', example: 1 })
  @ApiResponse({ status: 200, description: 'Service mis à jour avec succès.' })
  @ApiResponse({ status: 404, description: 'Service ou Direction non trouvé.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN) // 🔑 Réservé aux ADMINS
  @ApiOperation({ summary: 'Supprimer un service' })
  @ApiParam({ name: 'id', description: 'ID du service à supprimer', example: 1 })
  @ApiResponse({ status: 200, description: 'Service supprimé avec succès.' })
  @ApiResponse({ status: 404, description: 'Service introuvable.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.remove(id);
  }
}

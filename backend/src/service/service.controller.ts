import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ServicesService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau service' })
  @ApiResponse({ status: 201, description: 'Le service a été créé avec succès.' })
  @ApiResponse({ status: 400, description: "Données d'entrée invalides." })
  @ApiResponse({ status: 404, description: 'Direction associée non trouvée.' })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer la liste de tous les services' })
  @ApiResponse({ status: 200, description: 'Liste des services récupérée.' })
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un service par son ID' })
  @ApiParam({ name: 'id', description: 'ID du service', example: 1 })
  @ApiResponse({ status: 200, description: 'Détails du service trouvés.' })
  @ApiResponse({ status: 404, description: 'Service introuvable.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un service existant' })
  @ApiParam({ name: 'id', description: 'ID du service à modifier', example: 1 })
  @ApiResponse({ status: 200, description: 'Service mis à jour avec succès.' })
  @ApiResponse({ status: 404, description: 'Service ou Direction non trouvé.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un service' })
  @ApiParam({ name: 'id', description: 'ID du service à supprimer', example: 1 })
  @ApiResponse({ status: 200, description: 'Service supprimé avec succès.' })
  @ApiResponse({ status: 404, description: 'Service introuvable.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.remove(id);
  }
}

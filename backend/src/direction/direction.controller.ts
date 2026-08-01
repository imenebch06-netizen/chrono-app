import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DirectionsService } from './direction.service';
import { CreateDirectionDto } from './dto/create-direction.dto';
import { UpdateDirectionDto } from './dto/update-direction.dto';

@ApiTags('Directions')
@Controller('directions')
export class DirectionsController {
  constructor(private readonly directionsService: DirectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle direction' })
  @ApiResponse({ status: 201, description: 'La direction a été créée avec succès.' })
  @ApiResponse({ status: 400, description: "Données d'entrée invalides." })
  create(@Body() createDirectionDto: CreateDirectionDto) {
    return this.directionsService.create(createDirectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer la liste de toutes les directions' })
  @ApiResponse({ status: 200, description: 'Liste des directions récupérée.' })
  findAll() {
    return this.directionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une direction par son ID' })
  @ApiParam({ name: 'id', description: 'ID de la direction', example: 1 })
  @ApiResponse({ status: 200, description: 'Détails de la direction trouvés.' })
  @ApiResponse({ status: 404, description: 'Direction introuvable.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.directionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une direction existante' })
  @ApiParam({ name: 'id', description: 'ID de la direction à modifier', example: 1 })
  @ApiResponse({ status: 200, description: 'Direction mise à jour avec succès.' })
  @ApiResponse({ status: 404, description: 'Direction introuvable.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDirectionDto: UpdateDirectionDto) {
    return this.directionsService.update(id, updateDirectionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une direction' })
  @ApiParam({ name: 'id', description: 'ID de la direction à supprimer', example: 1 })
  @ApiResponse({ status: 200, description: 'Direction supprimée avec succès.' })
  @ApiResponse({ status: 404, description: 'Direction introuvable.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.directionsService.remove(id);
  }
}

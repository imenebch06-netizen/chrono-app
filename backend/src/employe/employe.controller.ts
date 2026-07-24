import { Controller, Post, Body, Get, Param, ParseIntPipe, Patch, Delete } from '@nestjs/common';
import { EmployeService } from './employe.service';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { UpdateEmployeDto } from './dto/update-employe.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Employés')
@Controller('employe')
export class EmployeController {
  constructor(private readonly employeService: EmployeService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel employé' })
  @ApiResponse({ status: 201, description: 'Employé créé avec succès.' })
  @ApiResponse({ status: 409, description: 'Cet email est déjà utilisé.' })
  create(@Body() createEmployeDto: CreateEmployeDto) {
    return this.employeService.create(createEmployeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir la liste de tous les employés' })
  @ApiResponse({ status: 200, description: 'Liste récupérée avec succès.' })
  findAll() {
    return this.employeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un employé par son ID' })
  @ApiParam({ name: 'id', example: 1, description: "ID de l'employé" })
  @ApiResponse({ status: 200, description: 'Employé trouvé.' })
  @ApiResponse({ status: 404, description: 'Employé introuvable.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Mettre à jour les informations d'un employé" })
  @ApiParam({ name: 'id', example: 1, description: "ID de l'employé" })
  @ApiResponse({ status: 200, description: 'Employé mis à jour.' })
  @ApiResponse({ status: 404, description: 'Employé introuvable.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateEmployeDto: UpdateEmployeDto) {
    return this.employeService.update(id, updateEmployeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un employé' })
  @ApiParam({ name: 'id', example: 1, description: "ID de l'employé" })
  @ApiResponse({ status: 200, description: 'Employé supprimé.' })
  @ApiResponse({ status: 404, description: 'Employé introuvable.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeService.remove(id);
  }
}

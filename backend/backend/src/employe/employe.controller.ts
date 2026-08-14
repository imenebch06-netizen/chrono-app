
import { Body,Delete, Controller, Get,Patch, Param, ParseIntPipe, Post, Req, UploadedFile, UseGuards, UseInterceptors} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmployeService } from './employe.service';
import { UpdateEmployeDto } from './dto/update-employe.dto';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
@ApiTags('Dashboard Employé')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employe/dashboard')
export class EmployeController {
  constructor(
    private readonly employeService: EmployeService
  ) {}

 // =========================================================================
  // 👤 1. ESPACE PERSONNEL (Accessible par TOUT utilisateur connecté)
  // =========================================================================

  @Get('me')
  @ApiOperation({ summary: 'Récupérer son propre profil (Espace Perso)' })
  async getMyProfile(@CurrentUser() user: any) {
    return this.employeService.findOne(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Modifier ses propres infos (mot de passe, adresse...)' })
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateEmployeDto: UpdateEmployeDto,
  ) {
    return this.employeService.update(user.id, updateEmployeDto);
  }

  // =========================================================================
  // 👔 2. ESPACE MANAGER (Accessible par MANAGER et ADMIN)
  // =========================================================================

  @Get('mon-equipe')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Récupérer les employés sous la responsabilité du manager' })
  async getMyTeam(@CurrentUser() user: any) {
    // On passe l'ID du manager connecté
    return this.employeService.findSubordinatesByManager(user.id);
  }

  // =========================================================================
  // 🛡️ 3. ESPACE ADMIN / GESTION GLOBALE (Accessible par ADMIN seul)
  // =========================================================================

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Créer un nouvel employé (Admin)' })
  async create(@Body() createEmployeDto: CreateEmployeDto) {
    return this.employeService.create(createEmployeDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lister TOUS les employés de l’entreprise (Admin)' })
  async findAll() {
    return this.employeService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtenir les détails d’un employé par son ID (Admin)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Modifier un employé existant (Admin)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeDto: UpdateEmployeDto,
  ) {
    console.log('📥 REÇU DANS NESTJS :', updateEmployeDto);
    return this.employeService.update(id, updateEmployeDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Supprimer un employé (Admin)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeService.remove(id);
  }
}

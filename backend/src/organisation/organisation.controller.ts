import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrganizationService } from './organisation.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

@ApiTags('Organizations') 
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles(Role.ADMIN)
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une nouvelle organisation',
    description:
      'Crée un nouveau nœud dans l’arborescence. Calcule automatiquement le "path" matérialisé en fonction de l’organisation parente.',
  })
  @ApiResponse({
    status: 201,
    description: 'L’organisation a été créée avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou employé déjà manager ailleurs.',
  })
  @ApiResponse({
    status: 404,
    description: 'Organisation parente non trouvée.',
  })
  create(@Body() createDto: CreateOrganizationDto) {
    return this.organizationService.create(createDto);
  }

 
  @Get()
  @ApiOperation({
    summary: 'Lister toutes les organisations',
    description:
      'Retourne la liste complète des organisations ordonnées par leur chemin hiérarchique (path ascendant).',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des organisations récupérée avec succès.',
  })
  findAll() {
    return this.organizationService.findAll();
  }
 
   @Get('org-types')
  @ApiOperation({
    summary: 'Lister toutes les types d organisations',
    description:
      'Retourne la liste complète des types d organisations.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des types d organisations récupérée avec succès.',
  })
  findAllTypes() {
    return this.organizationService.findAllTypes();
  }

  @Get('org-tree')
  @ApiOperation({
    summary: 'OBTENIR L ARBRE HIÉRARCHIQUE COMPLET POUR LE SIDEBAR',
    description:
      'Retourne l arbre',
  })
  @ApiResponse({
    status: 200,
    description: 'Arbre récupérée avec succès.',
  })
  getTree() {
    return this.organizationService.getTree();
  }

  
 
  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir les détails d’une organisation par son ID',
    description:
      'Retourne les informations d’une organisation incluant son type, ses enfants directs, son manager et la liste de ses employés rattachés.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Identifiant unique de l’organisation',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Organisation trouvée.',
  })
  @ApiResponse({
    status: 404,
    description: 'Organisation introuvable.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.findOne(id);
  }

  
  @Get(':id/sub-organizations')
  @ApiOperation({
    summary: 'Obtenir toute la sous-arborescence d’une organisation',
    description:
      'Récupère une organisation ainsi que TOUTES ses sous-organisations (enfants, petits-enfants, etc.) en exploitant le champ path.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de l’organisation racine de la recherche',
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'Sous-arborescence récupérée avec succès.',
  })
  @ApiResponse({
    status: 404,
    description: 'Organisation source introuvable.',
  })
  getSubOrganizations(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.getSubOrganizations(id);
  }

  @Patch(':id/manager')
  @ApiOperation({
    summary: 'Affecter ou retirer le manager d’une organisation',
    description:
      'Assigne un nouvel employé comme responsable ou passe managerId à null pour libérer le poste. L’employé doit obligatoirement appartenir à la branche de l’organisation.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de l’organisation ciblée',
    example: 3,
  })
  @ApiBody({ type: AssignManagerDto })
  @ApiResponse({
    status: 200,
    description: 'Manager mis à jour avec succès.',
  })
  @ApiResponse({
    status: 400,
    description:
      'L’employé n’appartient pas à la branche ou est déjà manager d’une autre organisation.',
  })
  @ApiResponse({
    status: 404,
    description: 'Organisation ou employé introuvable.',
  })
  assignManager(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignManagerDto,
  ) {
    return this.organizationService.assignManager(id, dto);
  }

 
  @Patch(':id')
  @ApiOperation({
    summary: 'Modifier les informations ou déplacer une organisation',
    description:
      'Permet de modifier le nom, le type ou de changer d’organisation parente (ce qui recalculera le path de l’organisation et de toute sa descendance).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de l’organisation à modifier',
    example: 4,
  })
  @ApiResponse({
    status: 200,
    description: 'Organisation mise à jour avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Déplacement impossible (ex: dépendance circulaire).',
  })
  @ApiResponse({
    status: 404,
    description: 'Organisation ou nouveau parent introuvable.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(id, dto);
  }


  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une organisation',
    description:
      'Supprime un nœud d’organisation. La suppression est bloquée s’il existe encore des sous-organisations enfants.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de l’organisation à supprimer',
    example: 5,
  })
  @ApiResponse({
    status: 204,
    description: 'Organisation supprimée avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer car elle possède des enfants.',
  })
  @ApiResponse({
    status: 404,
    description: 'Organisation introuvable.',
  })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.delete(id);
  }


  
 

}
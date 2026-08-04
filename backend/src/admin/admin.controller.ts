import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';


@Controller('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // 🔒 Protection par JWT et vérification des rôles
@Roles(Role.ADMIN)                   // Seul un utilisateur avec le rôle ADMIN peut y accéder
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /api/admin/stats
   * Récupère la répartition globale des employés (présents, congés, repos, récup, absents)
   * et le nombre de demandes en attente.
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard) // 🔒 Protection par JWT et vérification des rôles
  @Roles(Role.ADMIN)                   // Seul un utilisateur avec le rôle ADMIN peut y accéder
  @ApiOperation({ summary: 'Obtenir les statistiques globales du système' })
  async getStats() {
    return this.adminService.getGlobalStats();
  }


}
import { Controller, Get, Patch, Delete, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@ApiTags('Notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Récupérer les notifications de l'utilisateur connecté
  @Get('my')
  @ApiOperation({ summary: 'Récupérer mes notifications' })
  @ApiResponse({ status: 200, description: 'Liste des notifications de l’utilisateur connecté.' })
  @ApiResponse({ status: 401, description: 'Utilisateur non authentifié.' })
  async getMyNotifications(@Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub;
    if (!userId) return [];

    return this.prisma.notification.findMany({
      where: { employeId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limite aux 20 plus récentes
    });
  }

  // 2. Marquer comme lue
  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification mise à jour avec succès.' })
  @ApiResponse({ status: 404, description: 'Notification introuvable.' })
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  // 3. Supprimer une notification
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une notification' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification supprimée avec succès.' })
  @ApiResponse({ status: 404, description: 'Notification introuvable.' })
  async deleteNotification(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompteurDto } from './dto/update-compteur.dto';

@Injectable()
export class CompteurService {
  private readonly logger = new Logger(CompteurService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------
  // 1. LECTURE ET CRÉATION AUTOMATIQUE
  // ---------------------------------------------------------------------

  /**
   * Récupère le compteur d'un employé. S'il n'existe pas, il est créé par défaut.
   */
  async getByEmploye(employeId: number) {
    const employe = await this.prisma.employe.findUnique({ where: { id: employeId } });
    if (!employe) {
      throw new NotFoundException(`L'employé avec l'ID ${employeId} n'existe pas.`);
    }

    return this.prisma.compteur.upsert({
      where: { employeId },
      update: {},
      create: {
        employeId,
        solde_conges: 0.0, // 👈 0.0 par défaut si acquisition mensuelle (+2.08j/mois)
        solde_rtt: 0.0,
        credit_debit: 0.0,
      },
    });
  }

  /**
   * Modification manuelle d'un solde par un RH ou Admin
   */
  async updateCompteur(employeId: number, dto: UpdateCompteurDto) {
    await this.getByEmploye(employeId); // Garantit l'existence du compteur

    return this.prisma.compteur.update({
      where: { employeId },
      data: dto,
    });
  }

  // ---------------------------------------------------------------------
  // 2. LOGIQUE DE CLÔTURE DE PÉRIODE & REMISE À ZÉRO
  // ---------------------------------------------------------------------

  /**
   * Clôture Mensuelle :
   * Les RTT ayant été crédités en TEMPS RÉEL lors de l'importation des pointages,
   * la clôture mensuelle sert uniquement à réinitialiser le compteur du mois `credit_debit`.
   */
  async reinitialiserCreditDebitMensuel() {
    this.logger.log('🔄 Remise à zéro mensuelle du crédit/débit...');

    await this.prisma.compteur.updateMany({
      data: {
        credit_debit: 0.0, // 👈 On remet le compteur mensuel à 0 sans ré-incrémenter le solde RTT
      },
    });

    this.logger.log('✅ Remise à zéro du crédit/débit effectuée.');
    return { message: 'Clôture mensuelle du crédit/débit réussie.' };
  }

  /**
   * Attribution mensuelle des congés payés (+2.08 jours le 1er du mois)
   */
  async attributionMensuelleConges() {
    this.logger.log('🎁 Attribution mensuelle des congés payés (+2.08j)...');

    await this.prisma.compteur.updateMany({
      data: {
        solde_conges: { increment: 2.08 },
      },
    });

    return { message: 'Attribution mensuelle de +2.08 jours de congés effectuée.' };
  }

  /**
   * Clôture Annuelle : Remise à zéro des RTT non consommés au 31 Décembre
   */
  async reinitialiserRttAnnuel() {
    this.logger.log('🧹 Remise à zéro annuelle des RTT non pris...');

    await this.prisma.compteur.updateMany({
      data: {
        solde_rtt: 0.0,
      },
    });

    return { message: 'Remise à zéro annuelle des soldes RTT effectuée.' };
  }

  // ---------------------------------------------------------------------
  // 3. TÂCHES AUTOMATIQUES PLANIFIÉES (CRON JOBS)
  // ---------------------------------------------------------------------

  // Exécuté automatiquement le 1er de chaque mois à 00h00
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleCronAttributionConges() {
    await this.attributionMensuelleConges();
  }

  // Exécuté automatiquement le dernier jour du mois à 23h59
  @Cron('59 23 28-31 * *')
  async handleCronClotureMensuelle() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Vérifie si demain est le 1er du mois suivant
    if (tomorrow.getDate() === 1) {
      await this.reinitialiserCreditDebitMensuel();
    }
  }

  // Exécuté automatiquement le 31 Décembre à 23h59
  @Cron('59 23 31 12 *')
  async handleCronRazRtt() {
    await this.reinitialiserRttAnnuel();
  }
}
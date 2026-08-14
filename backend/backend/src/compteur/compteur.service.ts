import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
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
        solde_conges: 0.0, // Initialisation à 0.0 (Option A)
        solde_rtt: 0.0,
        credit_debit: 0.0,
      },
    });
  }

  async updateCompteur(employeId: number, dto: UpdateCompteurDto) {
    await this.getByEmploye(employeId);

    return this.prisma.compteur.update({
      where: { employeId },
      data: dto,
    });
  }

  // ---------------------------------------------------------------------
  // 🆕 MÉTHODES DE SYNCHRONISATION EN TEMPS RÉEL
  // ---------------------------------------------------------------------

  /**
   * Ajuste le crédit/débit et synchronise immédiatement le solde RTT
   */
  async ajusterCreditDebit(employeId: number, diffCredit: number) {
    const compteur = await this.getByEmploye(employeId);
    
    const nouveauCredit = Number((compteur.credit_debit + diffCredit).toFixed(2));
    // RTT est le miroir positif du crédit/débit (redevient 0 s'il est négatif)
    const nouveauRtt = Math.max(0, nouveauCredit);

    return this.prisma.compteur.update({
      where: { employeId },
      data: {
        credit_debit: nouveauCredit,
        solde_rtt: nouveauRtt,
      },
    });
  }

  /**
   * Déduit les jours de Congés Payés
   */
  async deduireConges(employeId: number, nbJours: number) {
    const compteur = await this.getByEmploye(employeId);

    if (compteur.solde_conges < nbJours) {
      throw new BadRequestException(
        `Solde de congés insuffisant (${compteur.solde_conges} j disponible(s), ${nbJours} j requis).`,
      );
    }

    return this.prisma.compteur.update({
      where: { employeId },
      data: {
        solde_conges: Number((compteur.solde_conges - nbJours).toFixed(2)),
      },
    });
  }

  /**
   * Déduit les heures de récupération/RTT du crédit global
   */
  async deduireRtt(employeId: number, nbHeures: number) {
    const compteur = await this.getByEmploye(employeId);

    if (compteur.solde_rtt < nbHeures) {
      throw new BadRequestException(
        `Solde RTT insuffisant (${compteur.solde_rtt} h disponible(s), ${nbHeures} h requise(s)).`,
      );
    }

    const nouveauCredit = Number((compteur.credit_debit - nbHeures).toFixed(2));
    const nouveauRtt = Math.max(0, nouveauCredit);

    return this.prisma.compteur.update({
      where: { employeId },
      data: {
        credit_debit: nouveauCredit,
        solde_rtt: nouveauRtt,
      },
    });
  }

  // ---------------------------------------------------------------------
  // 2. LOGIQUE DE CLÔTURE DE PÉRIODE & REMISE À ZÉRO
  // ---------------------------------------------------------------------

  async reinitialiserCreditDebitMensuel() {
    this.logger.log('🔄 Remise à zéro mensuelle du crédit/débit...');

    await this.prisma.compteur.updateMany({
      data: {
        credit_debit: 0.0,
      },
    });

    this.logger.log('✅ Remise à zéro du crédit/débit effectuée.');
    return { message: 'Clôture mensuelle du crédit/débit réussie.' };
  }

  async attributionMensuelleConges() {
    this.logger.log('🎁 Attribution mensuelle des congés payés (+2.08j)...');

    await this.prisma.compteur.updateMany({
      data: {
        solde_conges: { increment: 2.08 },
      },
    });

    return { message: 'Attribution mensuelle de +2.08 jours de congés effectuée.' };
  }

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

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleCronAttributionConges() {
    await this.attributionMensuelleConges();
  }

  @Cron('59 23 28-31 * *')
  async handleCronClotureMensuelle() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (tomorrow.getDate() === 1) {
      await this.reinitialiserCreditDebitMensuel();
    }
  }

  @Cron('59 23 31 12 *')
  async handleCronRazRtt() {
    await this.reinitialiserRttAnnuel();
  }
}
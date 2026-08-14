import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { PersonalStats, TeamStats, AdminGlobalStats } from '../models/statistiques.model';

@Injectable({
  providedIn: 'root',
})
export class StatistiquesService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl; // Ex: http://localhost:3000/api

  /**
   * Helper pour calculer le Lundi de la semaine en cours au format YYYY-MM-DD
   */
  private getStartOfWeekDate(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajustement si dimanche
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  // =========================================================================
  // 1. STATISTIQUES PERSONNELLES (EMPLOYÉ CONNECTÉ)
  // =========================================================================
  getPersonalStats(): Observable<PersonalStats> {
    const mondayStr = this.getStartOfWeekDate();

    return forkJoin({
      compteur: this.http.get<any>(`${this.baseUrl}/compteurs/mon-compteur`),
      mesDemandes: this.http.get<any[]>(`${this.baseUrl}/demandes-absence/mes-demandes`),
      semaineRes: this.http.get<any>(`${this.baseUrl}/pointages/ma-semaine`, {
        params: { dateDebut: mondayStr },
      }),
    }).pipe(
      map(({ compteur, mesDemandes, semaineRes }) => {
        const pointages = semaineRes?.pointages || [];

        return {
          soldeConges: compteur?.solde_conges ?? 0,
          soldeRtt: compteur?.solde_rtt ?? 0,
          creditDebitHeures: compteur?.credit_debit ?? 0,
          tauxPresence: 100,
          demandesParStatut: {
            enAttente: mesDemandes.filter((d) => d.status === 'EN_ATTENTE').length,
            validees: mesDemandes.filter((d) => d.status === 'VALIDE').length,
            refusees: mesDemandes.filter((d) => d.status === 'REFUSE').length,
          },
          repartitionAbsences: {
            conges: mesDemandes.filter((d) => d.typeDemande === 'CONGE').length,
            absences: mesDemandes.filter((d) => d.typeDemande === 'ABSENCE').length,
            recuperations: mesDemandes.filter((d) => d.typeDemande === 'RECUPERATION').length,
          },
          evolutionHeuresMensuel: {
            mois: pointages.map((p: any) =>
              new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'short' })
            ),
            heuresTravaillees: pointages.map((p: any) => p.dureeHeures ?? 0),
            creditDebit: pointages.map((p: any) => p.creditDebit ?? 0),
          },
        };
      })
    );
  }

  // =========================================================================
  // 2. STATISTIQUES D'ÉQUIPE (MANAGER)
  // =========================================================================
  getTeamStats(): Observable<TeamStats> {
    const today = new Date().toISOString().split('T')[0];

    return forkJoin({
      subordinatesRes: this.http.get<any>(`${this.baseUrl}/employe/dashboard/mon-equipe`),
      demandesEnAttente: this.http.get<any[]>(`${this.baseUrl}/demandes-absence/en-attente/mon-equipe`),
      pointagesRes: this.http.get<any>(`${this.baseUrl}/pointages/mon-equipe`, {
        params: { date: today },
      }),
    }).pipe(
      map(({ subordinatesRes, demandesEnAttente, pointagesRes }) => {
        // Adaptation aux objets retournés par le NestJS Service
        const membres = subordinatesRes?.subordinates || [];
        const pointagesDuJour = pointagesRes?.pointages || [];
        const totalSubordonnes = subordinatesRes?.total ?? membres.length;

        const presentsCount = pointagesDuJour.length;
        const enCongeCount = Math.max(0, totalSubordonnes - presentsCount);

        return {
          organizationNom: subordinatesRes?.managerOrganization?.nom ?? 'Mon Équipe',
          totalSubordonnes,
          presentsAujourdhui: presentsCount,
          enCongeAujourdhui: enCongeCount,
          demandesEnAttenteValidation: demandesEnAttente.length,
          absencesParType: {
            labels: ['Congés Payés', 'Absences', 'Récupérations'],
            series: [
              demandesEnAttente.filter((d) => d.typeDemande === 'CONGE').length,
              demandesEnAttente.filter((d) => d.typeDemande === 'ABSENCE').length,
              demandesEnAttente.filter((d) => d.typeDemande === 'RECUPERATION').length,
            ],
          },
          membresSummary: membres.map((m: any) => ({
            employeId: m.id,
            nomComplet: `${m.prenom} ${m.nom}`,
            email: m.email,
            soldeConges: m.compteur?.solde_conges ?? 0,
            soldeRtt: m.compteur?.solde_rtt ?? 0,
            creditDebit: m.compteur?.credit_debit ?? 0,
            statutAujourdhui: pointagesDuJour.some((p: any) => p.employeId === m.id)
              ? 'PRESENT'
              : 'ABSENT',
          })),
        };
      })
    );
  }

  // =========================================================================
  // 3. STATISTIQUES GLOBALES (ADMINISTRATEUR)
  // =========================================================================
  getAdminStats(): Observable<AdminGlobalStats> {
    return forkJoin({
      employes: this.http.get<any[]>(`${this.baseUrl}/employe/dashboard`),
      organizations: this.http.get<any[]>(`${this.baseUrl}/organizations`),
      demandesEnAttente: this.http.get<any[]>(`${this.baseUrl}/demandes-absence/en-attente`),
      toutesLesDemandes: this.http.get<any[]>(`${this.baseUrl}/demandes-absence`),
    }).pipe(
      map(({ employes, organizations, demandesEnAttente, toutesLesDemandes }) => {
        return {
          totalEmployes: employes.length,
          totalOrganizations: organizations.length,
          tauxPresenceGlobal: 95,
          demandesEnAttenteTotales: demandesEnAttente.length,
          repartitionDemandesGlobales: {
            labels: ['Congés Payés', 'Absences', 'Récupérations'],
            series: [
              toutesLesDemandes.filter((d) => d.typeDemande === 'CONGE').length,
              toutesLesDemandes.filter((d) => d.typeDemande === 'ABSENCE').length,
              toutesLesDemandes.filter((d) => d.typeDemande === 'RECUPERATION').length,
            ],
          },
        };
      })
    );
  }
}
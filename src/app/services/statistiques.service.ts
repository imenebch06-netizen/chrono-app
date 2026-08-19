import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { PersonalStats, TeamStats, AdminGlobalStats, MembreStatSummary } from '../models/statistiques.model';
import { EmployeStatusService } from './employe-status.service';

@Injectable({
  providedIn: 'root',
})
export class StatistiquesService {
  private http = inject(HttpClient);
  private statusService = inject(EmployeStatusService);
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

  private getTodayDate(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  private toArray(raw: any, key: string): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw[key])) return raw[key];
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.results)) return raw.results;
    if (Array.isArray(raw.demandesValide)) return raw.demandesValide;
    if (raw.data) return this.toArray(raw.data, key);
    return [];
  }

  private normalizeType(value: any): string {
    return String(value ?? '').toUpperCase();
  }

  private requestOrFallback<T>(request: Observable<T>, fallback: T, name: string): Observable<T> {
    return request.pipe(
      catchError((error) => {
        console.error(`Erreur statistiques (${name}):`, error);
        return of(fallback);
      })
    );
  }

  // =========================================================================
  // 1. STATISTIQUES PERSONNELLES (EMPLOYÉ CONNECTÉ)
  // =========================================================================
 getPersonalStats(): Observable<PersonalStats> {
    const mondayStr = this.getStartOfWeekDate();

    return forkJoin({
      compteur: this.requestOrFallback(
        this.http.get<any>(`${this.baseUrl}/compteurs/mon-compteur`), {}, 'mon-compteur'
      ),
      mesDemandes: this.requestOrFallback(
        this.http.get<any[]>(`${this.baseUrl}/demandes-absence/mes-demandes`), [], 'mes-demandes'
      ),
      semaineRes: this.requestOrFallback(this.http.get<any>(`${this.baseUrl}/pointages/ma-semaine`, {
        params: new HttpParams().set('dateDebut', mondayStr), // Utilisation de HttpParams
      }), {}, 'ma-semaine'),
    }).pipe(
      map(({ compteur, mesDemandes, semaineRes }) => {
        const pointages = this.toArray(semaineRes, 'pointages');
        const demandes = this.toArray(mesDemandes, 'demandes');

        // -------------------------------------------------------------------
        // CALCUL DYNAMIQUE DU TAUX DE PRÉSENCE INDIVIDUEL (EN %)
        // -------------------------------------------------------------------
        
        // 1. Jours où l'employé a un pointage valide (> 0 heures ou statut PRÉSENT)
        const joursTravailles = pointages.filter(
          (p: any) => (p.dureeHeures ?? 0) > 0 || p.statut === 'PRESENT'
        ).length;

        // 2. Déterminer le nombre de jours ouvrés écoulés cette semaine (Lundi à Aujourd'hui, max 5)
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 5 = Vendredi, 6 = Samedi
        
        // Ex: Si on est Mercredi (day = 3), il y a eu 3 jours ouvrés (Lundi, Mardi, Mercredi)
        const joursOuvresEcoules = dayOfWeek === 0 ? 5 : Math.min(dayOfWeek, 5);

        // 3. Calcul du taux de présence (Plafonné à 100%)
        const tauxPresence = joursOuvresEcoules > 0
          ? Math.min(100, Math.round((joursTravailles / joursOuvresEcoules) * 100))
          : 100;

        return {
          soldeConges: compteur?.solde_conges ?? 0,
          soldeRtt: compteur?.solde_rtt ?? 0,
          creditDebitHeures: compteur?.credit_debit ?? 0,
          tauxPresence, // <-- VALEUR DYNAMIQUE
          demandesParStatut: {
            enAttente: demandes.filter((d) => this.normalizeType(d.status || d.statut) === 'EN_ATTENTE').length,
            validees: demandes.filter((d) => ['VALIDE', 'VALIDEE', 'APPROVED', 'APPROUVEE'].includes(this.normalizeType(d.status || d.statut))).length,
            refusees: demandes.filter((d) => ['REFUSE', 'REFUSEE', 'REJECTED'].includes(this.normalizeType(d.status || d.statut))).length,
          },
          repartitionAbsences: {
            conges: demandes.filter((d) => this.normalizeType(d.typeDemande || d.type_demande || d.type) === 'CONGE').length,
            absences: demandes.filter((d) => this.normalizeType(d.typeDemande || d.type_demande || d.type) === 'ABSENCE').length,
            recuperations: demandes.filter((d) => this.normalizeType(d.typeDemande || d.type_demande || d.type) === 'RECUPERATION').length,
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
    const today = this.getTodayDate();

    return forkJoin({
      subordinatesRes: this.requestOrFallback(
        this.http.get<any>(`${this.baseUrl}/employe/dashboard/mon-equipe`), {}, 'mon-equipe-employes'
      ),
      demandesEnAttente: this.requestOrFallback(
        this.http.get<any[]>(`${this.baseUrl}/demandes-absence/en-attente/mon-equipe`), [], 'demandes-en-attente-equipe'
      ),
      demandesValidees: this.requestOrFallback(
        this.http.get<any>(`${this.baseUrl}/demandes-absence/demandes-valides/team`), {}, 'demandes-valides-equipe'
      ),
      pointagesRes: this.requestOrFallback(this.http.get<any>(`${this.baseUrl}/pointages/mon-equipe`, {
        params: { date: today },
      }), {}, 'pointages-equipe'),
      planningsRes: this.requestOrFallback(this.http.get<any>(`${this.baseUrl}/planning/global`, {
        params: { startDate: today, endDate: today },
      }), {}, 'planning-global-equipe'),
    }).pipe(
      map(({ subordinatesRes, demandesEnAttente, demandesValidees, pointagesRes, planningsRes }) => {
        // Adaptation aux objets retournés par le NestJS Service
        const membres = this.toArray(subordinatesRes, 'subordinates');
        const demandesEnAttenteList = this.toArray(demandesEnAttente, 'demandes');
        const demandesValideesList = this.toArray(demandesValidees, 'demandes');
        const pointagesDuJour = this.toArray(pointagesRes, 'pointages');
        const planningsDuJour = this.toArray(planningsRes, 'plannings');
        const totalSubordonnes = subordinatesRes?.total ?? membres.length;

        const statuts = membres.map((m: any) => this.statusService.calculerEtat(
          m.id,
          pointagesDuJour,
          demandesValideesList,
          planningsDuJour,
          today
        ));
        const presentsCount = statuts.filter((status) => status.etat === 'PRESENT').length;
        const enCongeCount = Math.max(0, totalSubordonnes - presentsCount);

        return {
          organizationNom: subordinatesRes?.managerOrganization?.nom ?? 'Mon Équipe',
          totalSubordonnes,
          presentsAujourdhui: presentsCount,
          enCongeAujourdhui: enCongeCount,
          demandesEnAttenteValidation: demandesEnAttenteList.length,
          absencesParType: {
            labels: ['Congés Payés', 'Absences', 'Récupérations'],
            series: [
              demandesValideesList.filter((d) => this.normalizeType(d.typeDemande || d.type_demande || d.type) === 'CONGE').length,
              demandesValideesList.filter((d) => this.normalizeType(d.typeDemande || d.type_demande || d.type) === 'ABSENCE').length,
              demandesValideesList.filter((d) => this.normalizeType(d.typeDemande || d.type_demande || d.type) === 'RECUPERATION').length,
            ],
          },
          membresSummary: membres.map((m: any, index: number) => ({
            employeId: m.id,
            nomComplet: `${m.prenom} ${m.nom}`,
            email: m.email,
            soldeConges: m.compteur?.solde_conges ?? 0,
            soldeRtt: m.compteur?.solde_rtt ?? 0,
            creditDebit: m.compteur?.credit_debit ?? 0,
            statutAujourdhui: statuts[index].etat as MembreStatSummary['statutAujourdhui'],
          })),
        };
      })
    );
  }

  // =========================================================================
  // 3. STATISTIQUES GLOBALES (ADMINISTRATEUR)
  // =========================================================================
  getAdminStats(): Observable<AdminGlobalStats> {
    const today = this.getTodayDate();

    return forkJoin({
      employes: this.requestOrFallback(
        this.http.get<any>(`${this.baseUrl}/employe/dashboard`), [], 'employes-admin'
      ),
      organizations: this.requestOrFallback(
        this.http.get<any>(`${this.baseUrl}/organizations`), [], 'organisations-admin'
      ),
      demandesEnAttente: this.requestOrFallback(
        this.http.get<any>(`${this.baseUrl}/demandes-absence/en-attente`), [], 'demandes-en-attente-admin'
      ),
      toutesLesDemandes: this.requestOrFallback(
        this.http.get<any>(`${this.baseUrl}/demandes-absence`), [], 'demandes-admin'
      ),
      // 1. Récupération des pointages du jour
      pointagesAujourdhui: this.requestOrFallback(this.http.get<any>(`${this.baseUrl}/pointages/date`, {
        params: new HttpParams().set('date', today)
      }), {}, 'pointages-admin'),
      planningsAujourdhui: this.requestOrFallback(this.http.get<any>(`${this.baseUrl}/planning/global`, {
        params: { startDate: today, endDate: today },
      }), {}, 'planning-global-admin'),
    }).pipe(
      map(({ employes, organizations, demandesEnAttente, toutesLesDemandes, pointagesAujourdhui, planningsAujourdhui }) => {
        const employesList = this.toArray(employes, 'users');
        const organizationsList = this.toArray(organizations, 'organizations');
        const demandesEnAttenteList = this.toArray(demandesEnAttente, 'demandes');
        const toutesLesDemandesList = this.toArray(toutesLesDemandes, 'demandes');
        const pointagesList = this.toArray(pointagesAujourdhui, 'pointages');
        const planningsList = this.toArray(planningsAujourdhui, 'plannings');
        const totalEmployes = employesList.length;

        const presentsCount = employesList.filter((employe: any) =>
          this.statusService.calculerEtat(
            employe.id,
            pointagesList,
            toutesLesDemandesList,
            planningsList,
            today
          ).etat === 'PRESENT'
        ).length;

        // 4. Calcul du taux dynamique (arrondi à l'entier le plus proche, sécurité contre division par 0)
        const tauxPresenceGlobal = totalEmployes > 0
          ? Math.round((presentsCount / totalEmployes) * 100)
          : 0;

        return {
          totalEmployes,
          totalOrganizations: organizationsList.length,
          tauxPresenceGlobal, // <-- Valeur 100% dynamique calculée !
          demandesEnAttenteTotales: demandesEnAttenteList.length,
          repartitionDemandesGlobales: {
            labels: ['Congés Payés', 'Absences', 'Récupérations'],
            series: [
              toutesLesDemandesList.filter((d) => this.normalizeType(d.typeDemande || d.type_demande || d.type) === 'CONGE').length,
              toutesLesDemandesList.filter((d) => this.normalizeType(d.typeDemande || d.type_demande || d.type) === 'ABSENCE').length,
              toutesLesDemandesList.filter((d) => this.normalizeType(d.typeDemande || d.type_demande || d.type) === 'RECUPERATION').length,
            ],
          },
        };
      })
    );
  }
}
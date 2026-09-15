import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { PlanningService, PlanningItem } from '../../services/planning.service';
import { PointageService } from '../../services/pointage.service';
import { DemandeAbsenceService } from '../../services/demande-absence.service';
import { AuthService } from 'src/app/services/auth.service';
import { EmployeStatusService } from 'src/app/services/employe-status.service';

export interface UserPlanningDisplay {
  heurDebut: string;
  heurFin: string;
  typeDeTravail: string;
  joursDeRepos: string;
  dateDebut: string;        
  dateFin: string;          
  etat: string;
  etatLibelleKey: string;
  etatIcon: string;
  etatCouleur: string;
}

@Component({
  selector: 'app-mon-planning',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    TablerIconsModule,
    TranslateModule
  ],
  templateUrl: './mon-planning.component.html',
})
export class MonPlanningComponent implements OnInit {
  private planningService = inject(PlanningService);
  private pointageService = inject(PointageService);
  private demandeService = inject(DemandeAbsenceService);
  private authService = inject(AuthService);
  private statusService = inject(EmployeStatusService);
  private translateService = inject(TranslateService);

  planningDisplay: UserPlanningDisplay | null = null;
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadMonPlanning();
  }

  private getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private extraireTableau(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    return res.data || res.pointages || res.demandes || res.plannings || [];
  }

  loadMonPlanning(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const currentUser = this.authService.getUser();
    const currentUserId = Number(currentUser?.id ?? currentUser?.sub);

    const aujourdhui = new Date();
    const aujourdhuiStr = this.getLocalDateString(aujourdhui);

    const hier = new Date(aujourdhui);
    hier.setDate(hier.getDate() - 1);
    const hierStr = this.getLocalDateString(hier);

     const reqPointages$ = this.pointageService.getMaSemaine(hierStr)
      .pipe(catchError(err => { console.error('Erreur pointages:', err); return of([]); }));

    const reqDemandes$ = this.demandeService.getMesDemandes()
      .pipe(catchError(err => { console.error('Erreur demandes:', err); return of([]); }));

    const reqPlannings$ = this.planningService.getMonPlanning()
      .pipe(catchError(err => { console.error('Erreur planning:', err); return of([]); }));

    forkJoin({
      pointages: reqPointages$,
      demandes: reqDemandes$,
      plannings: reqPlannings$,
    }).subscribe({
      next: ({ pointages, demandes, plannings }) => {
        this.isLoading = false;

        const planningsArray = this.extraireTableau(plannings);
         const demandesArray = this.extraireTableau(demandes);

         const pointagesBruts = this.extraireTableau(pointages);
        const pointagesReels = pointagesBruts.filter(
          (p: any) => p && !p.estAbsenceAutomatique
        );

        if (!planningsArray || planningsArray.length === 0) {
          this.planningDisplay = null;
          return;
        }

       
        const planningActif = planningsArray.find((pl: any) => {
          const debut = String(pl.dateDebut).split('T')[0];
          const fin = String(pl.dateFin || pl.dateDebut).split('T')[0];
          return aujourdhuiStr >= debut && aujourdhuiStr <= fin;
        }) || planningsArray[planningsArray.length - 1];

        const statutInfo = this.statusService.calculerEtat(
          currentUserId,
          pointagesReels,
          demandesArray,
          planningsArray,
          aujourdhuiStr
        );

        this.planningDisplay = this.mapToDisplayFormat(planningActif, statutInfo);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.translateService.instant('MY_SCHEDULE.ERROR_LOADING');
        console.error('Erreur chargement planning:', err);
      },
    });
  }

  private mapToDisplayFormat(
    item: PlanningItem,
    statutInfo: { etat: string; libelle: string }
  ): UserPlanningDisplay {
    return {
      heurDebut: item.heureDebut || '08:00',
      heurFin: item.heureFin || '16:30',
      typeDeTravail: item.type_travail || 'NORMAL',
      joursDeRepos: this.formatJoursRepos(item.joursRepos),
      dateDebut: this.formatDateAffichage(item.dateDebut),
      dateFin: this.formatDateAffichage(item.dateFin),
      etat: statutInfo.etat,
      etatLibelleKey: this.statusService.getLibelleEtatKey(statutInfo.etat),
      etatIcon: this.getIconTablerEtat(statutInfo.etat),
      etatCouleur: this.statusService.getColorClasseEtat(statutInfo.etat),
    };
  }

  private getIconTablerEtat(etat: string): string {
    const icones: Record<string, string> = {
      PRESENT: 'circle-check',
      CONGE: 'beach',
      RECUPERATION: 'refresh',
      REPOS: 'bed',
      ABSENT_JUSTIFIE: 'shield-check',
      ABSENT_NON_JUSTIFIE: 'alert-triangle',
      NON_ASSIGNEE: 'calendar-off'
    };
    return icones[etat] ?? 'calendar-off';
  }

  private formatJoursRepos(jours: any): string {
    if (!jours) return this.translateService.instant('MY_SCHEDULE.NONE');

    let daysArray: number[] = [];
    if (typeof jours === 'string') {
      try {
        daysArray = JSON.parse(jours);
      } catch {
        return jours;
      }
    } else if (Array.isArray(jours)) {
      daysArray = jours;
    }

    const dayKeys: { [key: number]: string } = {
      1: 'DAYS.MONDAY',
      2: 'DAYS.TUESDAY',
      3: 'DAYS.WEDNESDAY',
      4: 'DAYS.THURSDAY',
      5: 'DAYS.FRIDAY',
      6: 'DAYS.SATURDAY',
      0: 'DAYS.SUNDAY',
      7: 'DAYS.SUNDAY',
    };

    return daysArray
      .map((day) => dayKeys[day] ? this.translateService.instant(dayKeys[day]) : day)
      .join(', ');
  }

  
  private formatDateAffichage(dateInput: any): string {
    if (!dateInput) return '-';
    const str = String(dateInput).split('T')[0];
    const [annee, mois, jour] = str.split('-');
    if (!annee || !mois || !jour) return str;
    return `${jour}/${mois}/${annee}`;
  }
}
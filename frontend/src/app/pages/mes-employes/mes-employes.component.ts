import { Component, inject, ViewChild, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TablerIconsModule } from 'angular-tabler-icons';
import { DataTableTestComponent } from '../../components/data-table/data-table.component';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';

import { EmployeStatusService } from 'src/app/services/employe-status.service';
import { PointageService } from 'src/app/services/pointage.service';
import { DemandeAbsenceService } from 'src/app/services/demande-absence.service';
import { PlanningService } from 'src/app/services/planning.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-mes-employes',
  standalone: true,
  imports: [
    CommonModule,
    DataTableTestComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TablerIconsModule,
    MatChipsModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './mes-employes.component.html'
})
export class MesEmployesComponent implements OnInit {

  @ViewChild('maTable') dataTable!: DataTableTestComponent;
  
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private pointageService = inject(PointageService);
  private demandeService = inject(DemandeAbsenceService);
  private planningService = inject(PlanningService);
  private statusService = inject(EmployeStatusService);

  public isReadOnly: boolean = false;
  public filtreEtatActif: string = 'TOUS';
  public viewMode: 'ALL' | 'TEAM' | 'WITHOUT_PLANNING' = 'TEAM';

  employesListeComplete: any[] = [];

  ngOnInit(): void {
    const userRole = (this.authService.getUserRole() || '').toUpperCase();
    const currentUser = this.authService.getUser();

    const isAdmin = userRole === 'ADMIN';

    const isManager = 
      userRole === 'MANAGER' || 
      userRole === 'DIRECTEUR' || 
      userRole === 'DIRECTEUR_GENERAL' ||
      (userRole === 'EMPLOYE' && (
        currentUser?.isManager === true ||
        !!currentUser?.managedOrganizationId ||
        currentUser?.poste?.toLowerCase().includes('directeur') ||
        currentUser?.jobTitle?.toLowerCase().includes('directeur')
      ));

    if (isAdmin) {
      this.viewMode = 'ALL';
      this.isReadOnly = false;
    } else {
      this.viewMode = 'TEAM';
      this.isReadOnly = true;
    }

    this.chargerDonnees(isAdmin);
  }

  /**
   * Generer proprement la date locale YYYY-MM-DD
   */
  private getLocalDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  private extraireTableau(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    return res.data || res.users || res.subordinates || res.pointages || res.demandes || res.plannings || [];
  }

  chargerDonnees(isAdmin: boolean): void {
    const aujourdhuiStr = this.getLocalDateString();

    
    const reqEmployes$ = (this.viewMode === 'ALL') 
      ? this.userService.getUsers().pipe(catchError(err => { console.error('Erreur users:', err); return of([]); }))
      : this.userService.getMonEquipe().pipe(catchError(err => { console.error('Erreur equipe:', err); return of([]); }));

   
    const reqPointages$ = isAdmin
      ? this.pointageService.getPointagesParDate(aujourdhuiStr).pipe(catchError(() => of([])))
      : this.pointageService.getMonEquipe(aujourdhuiStr).pipe(catchError(() => of([])));

   
    const reqDemandes$ = isAdmin
      ? this.demandeService.getAllDemandes().pipe(catchError(() => of([])))
      : this.demandeService.getAllMyTeam().pipe(catchError(() => of([])));

   
const reqPlannings$ = isAdmin
  ? this.planningService.getGlobalPlanning(aujourdhuiStr, aujourdhuiStr).pipe(catchError(err => { console.error('Erreur planning global:', err); return of([]); }))
  : this.planningService.getMonEquipePlanning(aujourdhuiStr, aujourdhuiStr).pipe(catchError(err => { console.error('Erreur planning équipe:', err); return of([]); }));

    
    forkJoin({
     resEmployes: reqEmployes$,
      resPointages: reqPointages$,
      resDemandes: reqDemandes$,
      resPlannings: reqPlannings$
    }).subscribe({
     next: ({ resEmployes, resPointages, resDemandes, resPlannings }) => {
       
        const employes = this.extraireTableau(resEmployes);
        const pointages = this.extraireTableau(resPointages);
        const demandes = this.extraireTableau(resDemandes);
        const plannings = this.extraireTableau(resPlannings);
      // logs pour debug
        console.log('--- 📊 DEBUG RECEPTION PARALLELE ---');
        console.log('Employés trouvés:', employes.length);
        console.log('Pointages récupérés:', pointages);
        console.log('Demandes récupérées:', demandes);
        console.log('Plannings récupérés:', plannings);

        
        this.employesListeComplete = employes.map(emp => {
          const statusInfo = this.statusService.calculerEtat(emp.id, pointages, demandes, plannings, aujourdhuiStr);
          return {
            ...emp,
            etat: statusInfo.etat,
            etatLibelle: statusInfo.libelle
          };
        });
        
if (this.dataTable) {
  this.dataTable.setData(this.employesListeComplete);
}

        
        setTimeout(() => {
          if (this.dataTable) {
            this.dataTable.setData(this.employesListeComplete);
          }
        }, 0);
      },
      error: (err) => console.error('Erreur lors du traitement :', err)
    });
  }

  
  filtrerParEtat(etat: string): void {
    this.filtreEtatActif = etat;
    if (this.dataTable) {
      this.dataTable.filtrerParEtat(etat);
    }
  }

 
  filtrerTable(event: Event): void {
    if (this.dataTable) {
      this.dataTable.appliquerFiltre(event);
    }
  }

  
  ajouterEmploye(): void {
    if (this.dataTable) {
      this.dataTable.ajouterUnEmploye();
    }
  }
}
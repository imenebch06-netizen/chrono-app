import { Component, ViewChild, ChangeDetectorRef, AfterViewInit, OnInit, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UpperCasePipe, CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';

import { UserService, Employe, Role } from 'src/app/services/user.service';
import { OrganizationService, Organization } from 'src/app/services/organization.service';
import { MonFormDialogComponent } from '../form-dialog/form-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule, 
    MatPaginatorModule, 
    MatSortModule, 
    MatIconModule, 
    MatButtonModule,
    MatDialogModule,
    UpperCasePipe, 
    MatCardModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatCheckboxModule
  ],
  templateUrl: './data-table.component.html'
})
export class DataTableTestComponent implements OnInit, AfterViewInit, OnChanges {
  private snackBar = inject(MatSnackBar);
  private userService = inject(UserService);
  private orgService = inject(OrganizationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @Input() isReadOnly: boolean = false;
  @Input() showEditDelete: boolean = true;
  @Input() viewMode: 'ALL' | 'TEAM' | 'WITHOUT_PLANNING' = 'ALL';
  @Input() enableSelection: boolean = false;

  // 🟢 1. Réception réactive des données depuis le composant parent
  @Input() set data(value: any[]) {
    if (value) {
      this.isExternalData = true; // 🔒 Verrouille le rechargement API autonome
      this.dataSource.data = [...value];
      this.rafraichirTable();
    }
  }

  public selection = new SelectionModel<any>(true, []);

  private baseColumns: string[] = [
    'id', 'nom', 'prenom', 'email', 'adress', 'role', 'organizationId', 'etat', 'actions'
  ];
  displayedColumns: string[] = [...this.baseColumns];

  dataSource = new MatTableDataSource<Employe>([]);
  public organizationsList: Organization[] = [];
  private organizationsMap = new Map<number, Organization>();
  private isExternalData: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private notifier(message: string, estErreur: boolean = false): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: estErreur ? ['snack-bar-erreur'] : ['snack-bar-succes']
    });
  }

  ngOnInit(): void {
    this.initialiserColonnes();
    this.chargerOrganisations(); // 🟢 Charge uniquement les organisations sans écraser les employés
  }

  private initialiserColonnes(): void {
    if (this.enableSelection) {
      if (!this.displayedColumns.includes('select')) {
        this.displayedColumns = ['select', ...this.baseColumns];
      }
    } else {
      this.displayedColumns = [...this.baseColumns];
    }
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows && numRows > 0;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['enableSelection']) {
      this.initialiserColonnes();
    }
    if (changes['viewMode'] && !changes['viewMode'].firstChange && !this.isExternalData) {
      this.chargerEmployes();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // 🟢 Charge la liste des organisations pour la colonne Organisation / Map
  chargerOrganisations(): void {
    this.orgService.getOrganizations().subscribe({
      next: (res: any) => {
        const orgs: Organization[] = Array.isArray(res) ? res : (res?.data || []);
        this.organizationsList = orgs;
        this.organizationsMap.clear();

        orgs.forEach(org => {
          if (org.id !== undefined && org.id !== null) {
            this.organizationsMap.set(Number(org.id), org);
          }
        });

        // N'exécute le chargement d'employés que si les données ne viennent PAS du parent
        if (!this.isExternalData) {
          this.chargerEmployes();
        }
      },
      error: (err) => {
        console.error('Erreur chargement organisations:', err);
        if (!this.isExternalData) {
          this.chargerEmployes();
        }
      }
    });
  }

  chargerEmployes(): void {
    if (this.isExternalData) return; // ✋ Sécurité : Ne fait rien si le parent gère les données
    this.selection.clear();

    if (this.viewMode === 'ALL') {
      this.userService.getUsers().subscribe({
        next: (res: any) => {
          const employes = Array.isArray(res) ? res : (res?.data || res?.users || []);
          this.dataSource.data = employes;
          this.rafraichirTable();
        },
        error: (err) => console.error('Erreur chargement employés:', err)
      });
    } else {
      this.userService.getMonEquipe().subscribe({
        next: (res: any) => {
          let employes: any[] = Array.isArray(res) 
            ? res 
            : (res?.subordinates || res?.data || res?.users || []);

          if (this.viewMode === 'WITHOUT_PLANNING') {
            employes = employes.filter((emp: any) => {
              const aUnPlanning = Array.isArray(emp.plannings) && emp.plannings.length > 0;
              return !aUnPlanning;
            });
          }

          this.dataSource.data = employes;
          this.rafraichirTable();
        },
        error: (err) => {
          console.error('Erreur chargement équipe:', err);
          this.dataSource.data = [];
          this.rafraichirTable();
        }
      });
    }
  }

  private rafraichirTable(): void {
    if (this.paginator) this.dataSource.paginator = this.paginator;
    if (this.sort) this.dataSource.sort = this.sort;
    this.cdr.detectChanges();
  }

  private extractOrgId(element: any): number | null {
    if (!element) return null;
    const rawId = element.organizationId ?? element.organisationId ?? element.organization?.id;
    if (rawId === null || rawId === undefined || rawId === '') return null;
    const numericId = Number(rawId);
    return isNaN(numericId) ? null : numericId;
  }

  getOrgPath(element: Employe | any): string {
    const orgId = this.extractOrgId(element);
    return orgId ? this.buildOrgPath(orgId) : 'Non rattaché';
  }

  private buildOrgPath(orgId: number): string {
    let current = this.organizationsMap.get(Number(orgId));
    if (!current) return `Organisation #${orgId}`;

    const pathNames: string[] = [];
    const visited = new Set<number>();

    while (current && current.id !== undefined && !visited.has(Number(current.id))) {
      visited.add(Number(current.id));
      pathNames.unshift(current.nom);
      
      const parentId: number | undefined = current.idOrganizationSup ?? (current as any).organizationSup?.id;
      current = parentId !== undefined ? this.organizationsMap.get(Number(parentId)) : undefined;
    }

    return pathNames.join(' > ');
  }

  ajouterUnEmploye(): void {
    if (this.isReadOnly) return;

    const dialogRef = this.dialog.open(MonFormDialogComponent, {
      width: '600px',
      data: { 
        nom: '', prenom: '', email: '', password: '', adress: '', 
        role: Role.EMPLOYE, organizationId: null, organizations: this.organizationsList
      }
    });

    dialogRef.afterClosed().subscribe((nouveau) => {
      if (nouveau && nouveau.nom) {
        const payload = this.cleanPayload(nouveau);
        this.userService.createUser(payload).subscribe({
          next: () => {
            this.notifier('✅ Nouvel employé créé avec succès !');
            this.chargerOrganisations();
          },
          error: (err) => {
            const messageServeur = Array.isArray(err.error?.message) 
              ? err.error.message.join(', ') 
              : err.error?.message;
            this.notifier(`❌ Erreur création : ${messageServeur || 'Données invalides'}`, true);
          }
        });
      }
    });
  }

  edit(element: Employe): void {
    if (this.isReadOnly) return;

    if (!this.organizationsList || this.organizationsList.length === 0) {
      this.orgService.getOrganizations().subscribe({
        next: (orgs) => {
          this.organizationsList = orgs || [];
          this.ouvrirDialogModification(element);
        }
      });
    } else {
      this.ouvrirDialogModification(element);
    }
  }

  private ouvrirDialogModification(element: Employe): void {
    const rawOrgId = element.organizationId ?? element.organization?.id;

    const dialogRef = this.dialog.open(MonFormDialogComponent, {
      width: '600px',
      data: { 
        ...element,
        organizationId: (rawOrgId !== null && rawOrgId !== undefined) ? Number(rawOrgId) : null,
        organizations: [...this.organizationsList]
      }
    });

    dialogRef.afterClosed().subscribe((resultat) => {
      if (!resultat) return;
      const payload = this.cleanPayload(resultat);
      this.userService.updateUser(element.id, payload).subscribe({
        next: () => {
          this.notifier('✅ Employé mis à jour avec succès !');
          this.chargerOrganisations();
        },
        error: () => this.notifier('❌ Erreur lors de la modification de l\'employé', true)
      });
    });
  }

  private cleanPayload(source: any): any {
    const payload: any = {
      nom: source.nom?.trim(),
      prenom: source.prenom?.trim(),
      email: source.email?.trim(),
      role: source.role,
      adress: source.adress?.trim() || null,
      organizationId: (source.organizationId !== null && source.organizationId !== undefined && source.organizationId !== '') 
        ? Number(source.organizationId) 
        : null
    };

    if (source.password && source.password.trim() !== '') {
      payload.password = source.password.trim();
    }

    return payload;
  }

  voirDetails(element: Employe): void {
    this.router.navigate(['mes-employes/employe', element.id]);
  }

  delete(element: Employe): void {
    if (this.isReadOnly) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      panelClass: 'custom-dialog-container',
      data: {
        title: 'Supprimer un employé',
        message: `Voulez-vous vraiment supprimer ${element.prenom} ${element.nom} ?`,
        confirmText: 'Oui, supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe((confirme: boolean) => {
      if (confirme) {
        this.executerSuppression(element);
      }
    });
  }

  private executerSuppression(element: Employe): void {
    this.userService.deleteUser(element.id).subscribe({
      next: () => {
        this.snackBar.open(
          `✅ Employé "${element.prenom} ${element.nom}" supprimé avec succès !`,
          'Fermer',
          {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom',
            panelClass: ['bg-slate-900', 'text-white']
          }
        );
        this.chargerOrganisations();
      },
      error: (err) => {
        const messageServeur = Array.isArray(err.error?.message)
          ? err.error.message.join(', ')
          : err.error?.message;

        this.snackBar.open(
          `❌ Impossible de supprimer : ${messageServeur || 'Erreur serveur'}`,
          'Fermer',
          {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom',
            panelClass: ['bg-rose-600', 'text-white']
          }
        );
      }
    });
  }

  appliquerFiltre(event: Event | string): void {
    const filterValue = typeof event === 'string' ? event : (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filtrerParRole(roleSelectionne: string): void {
    this.dataSource.filter = roleSelectionne.trim().toLowerCase();
  }

  // 🟢 Fonctions d'état avec gestion sécurisée des types null / undefined
  getLibelleEtat(etat: string): string {
    if (!etat) return 'Non assignée';
    switch (etat) {
      case 'PRESENT': return 'Présent';
      case 'CONGE': return 'En Congé';
      case 'RECUPERATION': return 'Récupération';
      case 'REPOS': return 'Repos';
      case 'ABSENT_JUSTIFIE': return 'Abs. Justifiée';
      case 'ABSENT_NON_JUSTIFIE': return 'Abs. Non Justifiée';
      case 'NON_ASSIGNEE': return 'Non assignée';
      default: return etat;
    }
  }

  getIconEtat(etat: string): string {
    if (!etat) return 'event_busy';
    switch (etat) {
      case 'PRESENT': return 'check_circle';
      case 'CONGE': return 'flight_takeoff';
      case 'RECUPERATION': return 'autorenew';
      case 'REPOS': return 'bed';
      case 'ABSENT_JUSTIFIE': return 'verified';
      case 'ABSENT_NON_JUSTIFIE': return 'warning';
      case 'NON_ASSIGNEE': return 'event_busy';
      default: return 'bed';
    }
  }

  getColorEtat(etat: string): string {
    if (!etat) return 'text-secondary';
    switch (etat) {
      case 'PRESENT': return 'text-success';
      case 'CONGE': return 'text-primary';
      case 'RECUPERATION': return 'text-info';
      case 'REPOS': return 'text-secondary';
      case 'ABSENT_JUSTIFIE': return 'text-warning';
      case 'ABSENT_NON_JUSTIFIE': return 'text-error';
      case 'NON_ASSIGNEE': return 'text-warning';
      default: return 'text-secondary';
    }
  }

  filtrerParEtat(etat: string): void {
    if (etat === 'TOUS') {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filterPredicate = (data: Employe, filter: string) => {
        const etatEmp = (data as any).etat || 'NON_ASSIGNEE';
        return etatEmp.toLowerCase() === filter.toLowerCase();
      };
      this.dataSource.filter = etat.toLowerCase();
    }
  }

  // 🟢 Méthode appelée par le parent
  setData(data: any[]): void {
    if (data) {
      this.isExternalData = true; // 🔒 Activer le verrouillage
      this.dataSource.data = [...data];
      this.rafraichirTable();
    }
  }


  
}
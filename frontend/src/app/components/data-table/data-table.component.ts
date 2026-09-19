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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from 'src/app/services/language.service';

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
    MatCheckboxModule,
    TranslateModule
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
  private translate = inject(TranslateService);
  public languageService = inject(LanguageService);

  @Input() isReadOnly: boolean = false;
  @Input() showEditDelete: boolean = true;
  @Input() viewMode: 'ALL' | 'TEAM' | 'WITHOUT_PLANNING' = 'ALL';
  @Input() enableSelection: boolean = false;

  private filtreEtatCourant: string = 'TOUS';
  private filtreTexteCourant: string = '';


  @Input() set data(value: any[]) {
    if (value) {
      this.isExternalData = true; 
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
    this.snackBar.open(message, this.translate.instant('EMPLOYEE_TABLE.NOTIFICATIONS.CLOSE'), {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: estErreur ? ['snack-bar-erreur'] : ['snack-bar-succes']
    });
  }

  ngOnInit(): void {
    this.initialiserColonnes();
    this.configurerFiltreCombine();
    this.chargerOrganisations();
    
    this.translate.onLangChange.subscribe(() => {
    this.cdr.markForCheck();
  }); 
  }
  private configurerFiltreCombine(): void {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const matchEtat = (this.filtreEtatCourant === 'TOUS') || 
        ((data.etat || 'NON_ASSIGNEE').toLowerCase() === this.filtreEtatCourant.toLowerCase());

      const motCle = this.filtreTexteCourant.toLowerCase().trim();
      const matchTexte = !motCle || 
        `${data.nom || ''} ${data.prenom || ''} ${data.email || ''} ${data.role || ''}`.toLowerCase().includes(motCle);

      return matchEtat && matchTexte;
    };
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
    if (this.isExternalData) return;
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
    return orgId ? this.buildOrgPath(orgId) : this.translate.instant('EMPLOYEE_TABLE.NOT_ATTACHED');
  }

 getOrgName(element: any): string {
  const orgId = this.extractOrgId(element);
  
 
  const org = (orgId ? this.organizationsMap.get(orgId) : null) || element.organization;

  if (!org) {
    return orgId 
      ? (this.translate.instant('EMPLOYEE_TABLE.ORG_PREFIX') + orgId) 
      : this.translate.instant('EMPLOYEE_TABLE.NOT_ATTACHED');
  }

  const isEnglish = !this.languageService.isFrench();
  return (isEnglish && org.nom_en) ? org.nom_en : org.nom;
}

  
  private buildOrgPath(orgId: number): string {
    let current = this.organizationsMap.get(Number(orgId));
    if (!current) return `${this.translate.instant('EMPLOYEE_TABLE.ORG_PREFIX')}${orgId}`;

    const pathNames: string[] = [];
    const visited = new Set<number>();

    while (current && current.id !== undefined && !visited.has(Number(current.id))) {
      visited.add(Number(current.id));
      const nomLangue = (!this.languageService.isFrench() && current.nom_en) ? current.nom_en : current.nom;
      pathNames.unshift(nomLangue);
      
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
        nom: '', prenom: '', email: '', password: '', adress: '', adress_en: '',
        role: Role.EMPLOYE, organizationId: null, organizations: this.organizationsList
      }
    });

    dialogRef.afterClosed().subscribe((nouveau) => {
      if (nouveau && nouveau.nom) {
        const payload = this.cleanPayload(nouveau);
        this.userService.createUser(payload).subscribe({
          next: () => {
            this.notifier(this.translate.instant('EMPLOYEE_TABLE.NOTIFICATIONS.CREATE_SUCCESS'));
            this.chargerOrganisations();
          },
          error: (err) => {
            const messageServeur = Array.isArray(err.error?.message) 
              ? err.error.message.join(', ') 
              : err.error?.message;
            this.notifier(`${this.translate.instant('EMPLOYEE_TABLE.NOTIFICATIONS.CREATE_ERROR')}${messageServeur || this.translate.instant('EMPLOYEE_TABLE.NOTIFICATIONS.INVALID_DATA')}`, true);
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
          this.notifier(this.translate.instant('EMPLOYEE_TABLE.NOTIFICATIONS.UPDATE_SUCCESS'));
          this.chargerOrganisations();
        },
        error: () => this.notifier(this.translate.instant('EMPLOYEE_TABLE.NOTIFICATIONS.UPDATE_ERROR'), true)
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
      adress_en: source.adress_en?.trim() || null,
      latitude: source.latitude ?? null,
    longitude: source.longitude ?? null,
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
        title: this.translate.instant('EMPLOYEE_TABLE.DIALOG.DELETE_TITLE'),
        message: this.translate.instant('EMPLOYEE_TABLE.DIALOG.DELETE_CONFIRM_MSG', { name: `${element.prenom} ${element.nom}` }),
        confirmText: this.translate.instant('EMPLOYEE_TABLE.DIALOG.YES_DELETE'),
        cancelText: this.translate.instant('EMPLOYEE_TABLE.DIALOG.CANCEL')
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
          this.translate.instant('EMPLOYEE_TABLE.NOTIFICATIONS.DELETE_SUCCESS', { name: `${element.prenom} ${element.nom}` }),
          this.translate.instant('EMPLOYEE_TABLE.NOTIFICATIONS.CLOSE'),
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
          `${this.translate.instant('EMPLOYEE_TABLE.NOTIFICATIONS.DELETE_ERROR')}${messageServeur || this.translate.instant('EMPLOYEE_TABLE.NOTIFICATIONS.SERVER_ERROR')}`,
          this.translate.instant('EMPLOYEE_TABLE.NOTIFICATIONS.CLOSE'),
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
    this.filtreTexteCourant = typeof event === 'string' ? event : (event.target as HTMLInputElement).value;
    this.dataSource.filter = `${this.filtreEtatCourant}-${this.filtreTexteCourant}`;
  }

  filtrerParRole(roleSelectionne: string): void {
    this.dataSource.filter = roleSelectionne.trim().toLowerCase();
  }

 
  getLibelleEtat(etat: string): string {
    if (!etat) return this.translate.instant('EMPLOYEE_TABLE.STATUS.NOT_ASSIGNED');
    switch (etat) {
      case 'PRESENT': return this.translate.instant('EMPLOYEE_TABLE.STATUS.PRESENT');
      case 'CONGE': return this.translate.instant('EMPLOYEE_TABLE.STATUS.ON_LEAVE');
      case 'RECUPERATION': return this.translate.instant('EMPLOYEE_TABLE.STATUS.RECOVERY');
      case 'REPOS': return this.translate.instant('EMPLOYEE_TABLE.STATUS.REST');
      case 'ABSENT_JUSTIFIE': return this.translate.instant('EMPLOYEE_TABLE.STATUS.JUSTIFIED_ABSENCE');
      case 'ABSENT_NON_JUSTIFIE': return this.translate.instant('EMPLOYEE_TABLE.STATUS.UNJUSTIFIED_ABSENCE');
      case 'NON_ASSIGNEE': return this.translate.instant('EMPLOYEE_TABLE.STATUS.NOT_ASSIGNED');
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
    this.filtreEtatCourant = etat;
    this.dataSource.filter = `${this.filtreEtatCourant}-${this.filtreTexteCourant}`;
  }

  
  setData(data: any[]): void {
    if (data) {
      this.isExternalData = true; 
      this.dataSource.data = [...data];
      this.rafraichirTable();
    }
  }
}
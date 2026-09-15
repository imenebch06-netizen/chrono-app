import { Component, OnInit, ViewChild, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { Organization, OrganizationService } from '../../services/organization.service';
import { EditOrgDialogComponent } from '../../components/edit-org-dialog/edit-org-dialog.component';
import { AssignManagerDialogComponent } from '../../components/assign-manager-dialog/assign-manager-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-data-table2',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './data-table2.component.html'
})
export class DataTable2Component implements OnInit {
  @Output() orgUpdated = new EventEmitter<void>();

  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  public languageService = inject(LanguageService);
  
  displayedOrgColumns: string[] = ['id', 'nom', 'organizationSup', 'manager', 'actions'];
  orgDataSource = new MatTableDataSource<Organization>([]);

  @ViewChild('orgPaginator') orgPaginator!: MatPaginator;
  @ViewChild('orgSort') orgSort!: MatSort;

  public orgService = inject(OrganizationService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.chargerOrganizations();
  }

  chargerOrganizations(): void {
    this.orgService.getOrganizations().subscribe({
      next: (data) => {
        this.orgDataSource.data = [...data];
        this.orgDataSource.paginator = this.orgPaginator;
        this.orgDataSource.sort = this.orgSort;
      },
      error: (err) => console.error('Erreur chargement organisations:', err)
    });
  }

  appliquerFiltre(filterValue: string): void {
    this.orgDataSource.filter = filterValue.trim().toLowerCase();
  }

  getOrgPath(org: Organization): string {
    if (!org) return this.translate.instant('ORG_TABLE.NOT_DEFINED');
    return this.buildFullPath(org.id);
  }

  private buildFullPath(orgId: number): string {
    const orgs = this.orgDataSource.data;
    const orgMap = new Map(orgs.map(o => [o.id, o]));
    let current = orgMap.get(orgId);

    if (!current) return `${this.translate.instant('ORG_TABLE.ORG_PREFIX')}${orgId}`;

    const names: string[] = [];
    const visited = new Set<number>();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);

      const nomOrg = this.languageService.isFrench() ? current.nom : (current.nom_en || current.nom);
      names.unshift(nomOrg);
      
      const parentId: number | undefined = current.idOrganizationSup || current.organizationSup?.id;
      current = parentId ? orgMap.get(parentId) : undefined;
    }

    return names.join(' > ');
  }

  editOrg(org: Organization): void {
    const dialogRef = this.dialog.open(EditOrgDialogComponent, {
      width: '900px',
      data: {
        ...org,
        allOrgs: this.orgDataSource.data.filter(o => o.id !== org.id)
      }
    });

    dialogRef.afterClosed().subscribe((resultat) => {
      if (resultat && org.id) {
        const selectedParent = resultat.idOrganizationSup ? Number(resultat.idOrganizationSup) : null;

const payload = {
  nom: resultat.nom,
  nom_en: resultat.nom_en ? resultat.nom_en.trim() : null,
  typeOrganizationId: Number(resultat.typeOrganizationId),
  idOrganizationSup: (selectedParent === org.id) ? null : selectedParent
};

        this.orgService.updateOrganization(org.id, payload).subscribe({
          next: () => {
            this.chargerOrganizations();
            this.orgUpdated.emit();
          },
          error: (err) => console.error('❌ Erreur NestJS :', err.error?.message || err.error)
        });
      }
    });
  }

  assignManager(org: Organization): void {
    const dialogRef = this.dialog.open(AssignManagerDialogComponent, {
      width: '420px',
      data: { 
        managerId: org.managerId || org.manager?.id || null, 
        orgName: org.nom ,
        allOrgs: this.orgDataSource.data
      }
    });

    dialogRef.afterClosed().subscribe((selectedManagerId) => {
      if (selectedManagerId === undefined || selectedManagerId === '') {
        return;
      }
      const formattedId = selectedManagerId !== null ? Number(selectedManagerId) : null;
      if (!org.id) {
        console.error("ID d'organisation manquant");
        return;
      }
      this.orgService.assignManager(org.id, formattedId).subscribe({
        next: () => {
          this.snackBar.open(
            this.translate.instant('ORG_TABLE.NOTIFICATIONS.ASSIGN_MANAGER_SUCCESS'), 
            this.translate.instant('ORG_TABLE.NOTIFICATIONS.CLOSE'), 
            { duration: 3000 }
          );
          this.chargerOrganizations();
          this.orgUpdated.emit();
        },
        error: (err) => {
          const errorMessage = err.error?.message || this.translate.instant('ORG_TABLE.NOTIFICATIONS.ASSIGN_MANAGER_ERROR');
          this.snackBar.open(
            errorMessage, 
            this.translate.instant('ORG_TABLE.NOTIFICATIONS.CLOSE'), 
            {
              duration: 6000,
              panelClass: ['error-snackbar']
            }
          );
        }
      });
    });
  }

  deleteOrg(org: Organization): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      panelClass: 'custom-dialog-container',
      data: {
        title: this.translate.instant('ORG_TABLE.DIALOG.DELETE_TITLE'),
        message: this.translate.instant('ORG_TABLE.DIALOG.DELETE_CONFIRM_MSG', { name: org.nom }),
        confirmText: this.translate.instant('ORG_TABLE.DIALOG.YES_DELETE'),
        cancelText: this.translate.instant('ORG_TABLE.DIALOG.CANCEL')
      }
    });

    dialogRef.afterClosed().subscribe((confirme: boolean) => {
      if (confirme) {
        this.executerSuppression(org);
      }
    });
  }

  private executerSuppression(org: Organization): void {
    this.orgService.deleteOrganization(org.id).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('ORG_TABLE.NOTIFICATIONS.DELETE_SUCCESS', { name: org.nom }),
          this.translate.instant('ORG_TABLE.NOTIFICATIONS.CLOSE'),
          {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom',
            panelClass: ['bg-slate-900', 'text-white']
          }
        );
        this.chargerOrganizations();
        this.orgUpdated.emit();
      },
      error: (err) => {
        console.error('Erreur suppression organisation:', err);
        this.snackBar.open(
          this.translate.instant('ORG_TABLE.NOTIFICATIONS.DELETE_ERROR'),
          this.translate.instant('ORG_TABLE.NOTIFICATIONS.CLOSE'),
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
}
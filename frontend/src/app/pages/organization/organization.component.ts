import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';

import { Organization, OrganizationService } from '../../services/organization.service';
import { EditOrgDialogComponent } from '../../components/edit-org-dialog/edit-org-dialog.component';
import { DataTable2Component } from '../../components/data-table2/data-table2.component';
import { OrgTreeComponent } from '../org-tree/org-tree.component';

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    TablerIconsModule,
    TranslateModule,
    DataTable2Component,
    OrgTreeComponent
  ],
  templateUrl: './organization.component.html'
})
export class OrganizationComponent implements OnInit {
  
  @ViewChild('dataTableComponent') dataTable!: DataTable2Component;

  private orgService = inject(OrganizationService);
  private dialog = inject(MatDialog);
  private translateService = inject(TranslateService);
  
  organigrammeData: Organization[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.chargerArbre();
  }

  chargerArbre(): void {
    this.isLoading = true;
    this.orgService.getOrganizationTree().subscribe({
      next: (data) => {
        this.organigrammeData = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(this.translateService.instant('ORGANIZATION.ERROR_LOADING'), err);
        this.isLoading = false;
      }
    });
  }

  onSearch(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    if (this.dataTable) {
      this.dataTable.appliquerFiltre(filterValue);
    }
  }

  ajouterOrganization(): void {
    const currentOrgs = this.dataTable ? this.dataTable.orgDataSource.data : [];

    const dialogRef = this.dialog.open(EditOrgDialogComponent, {
      width: '500px',
      data: {
        nom: '',
        nom_en: '',
        typeOrganizationId: null,
        idOrganizationSup: null,
        allOrgs: currentOrgs
      }
    });

    dialogRef.afterClosed().subscribe((resultat) => {
      if (resultat && resultat.nom) {
        const payload = {
          nom: resultat.nom?.trim(),
          nom_en: resultat.nom_en?.trim() || null,
          typeOrganizationId: Number(resultat.typeOrganizationId),
          idOrganizationSup: resultat.idOrganizationSup ? Number(resultat.idOrganizationSup) : null
        };

        this.orgService.createOrganization(payload).subscribe({
          next: () => {
            if (this.dataTable) {
              this.dataTable.chargerOrganizations();
            }
            this.chargerArbre();
          },
          error: (err) => console.error(this.translateService.instant('ORGANIZATION.ERROR_CREATING'), err)
        });
      }
    });
  }
}
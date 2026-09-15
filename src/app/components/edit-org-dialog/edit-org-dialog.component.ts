import { Component, inject, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { OrganizationService } from 'src/app/services/organization.service';
import { LanguageService } from 'src/app/services/language.service';

@Component({
  selector: 'app-edit-org-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './edit-org-dialog.component.html',
})
export class EditOrgDialogComponent implements OnInit {
  typesOrganization: any[] = [];
  private orgService = inject(OrganizationService);
  public languageService = inject(LanguageService);
  
  constructor(
    public dialogRef: MatDialogRef<EditOrgDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    console.log(' Modale instanciée avec les données :', data);
  }

  ngOnInit(): void {
    this.chargerTypesOrganization();
  }

  chargerTypesOrganization(): void {
    this.orgService.getTypeOrganizations().subscribe({
      next: (types) => this.typesOrganization = types,
      error: (err) => console.error('Erreur chargement types organisation:', err)
    });
  }

  isValid(): boolean {
    return !!this.data.nom && this.data.typeOrganizationId !== null && this.data.typeOrganizationId !== undefined;
  }
}
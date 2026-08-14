import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Role } from 'src/app/services/user.service';
import { Organization } from 'src/app/services/organization.service';

export interface EmployeDialogData {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  password?: string;
  adress?: string;
  role: string;
  organizationId: number | null;
  organizations?: Organization[];
}

@Component({
  selector: 'app-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './form-dialog.component.html'
})
export class MonFormDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<MonFormDialogComponent>);
  public dataInjected: EmployeDialogData = inject(MAT_DIALOG_DATA);

  roles = [
    { value: Role.ADMIN, viewValue: 'Administrateur (ADMIN)' },
    { value: Role.EMPLOYE, viewValue: 'Employé (EMPLOYE)' }
  ];

  organizationsList: Organization[] = [];

  formData = {
    id: undefined as number | undefined,
    nom: '',
    prenom: '',
    email: '',
    password: '',
    adress: '',
    role: Role.EMPLOYE as string,
    organizationId: null as number | null
  };

  ngOnInit(): void {
    if (this.dataInjected) {
      this.organizationsList = this.dataInjected.organizations || [];

      // Initialisation explicite de formData à partir des données reçues
      this.formData = {
        id: this.dataInjected.id,
        nom: this.dataInjected.nom || '',
        prenom: this.dataInjected.prenom || '',
        email: this.dataInjected.email || '',
        password: '', // On laisse vide pour ne pas afficher le hash
        adress: this.dataInjected.adress || '',
        role: this.dataInjected.role || Role.EMPLOYE,
        organizationId: (this.dataInjected.organizationId !== null && this.dataInjected.organizationId !== undefined) 
          ? Number(this.dataInjected.organizationId) 
          : null
      };
    }
  }

  soumettreFormulaire(): void {
    const payload: any = { ...this.formData };

    // En cas de modification sans changement de mot de passe
    if (payload.id && !payload.password) {
      delete payload.password;
    }

    // Conversion garantie en Number ou null
    if (payload.organizationId !== null && payload.organizationId !== undefined && payload.organizationId !== '') {
      payload.organizationId = Number(payload.organizationId);
    } else {
      payload.organizationId = null;
    }

    this.dialogRef.close(payload);
  }

  fermer(): void {
    this.dialogRef.close();
  }
}
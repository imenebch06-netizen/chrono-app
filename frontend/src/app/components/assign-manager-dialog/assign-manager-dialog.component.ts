import { Component, inject, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { Employe, UserService } from 'src/app/services/user.service';
import { Organization } from '../../services/organization.service';

export interface AssignManagerData {
  managerId: number | null;
  orgName: string;
  allOrgs: Organization[];
}

@Component({
  selector: 'app-assign-manager-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    UpperCasePipe,
    TranslateModule
  ],
  templateUrl: './assign-manager-dialog.component.html',
})
export class AssignManagerDialogComponent implements OnInit {
  selectedManagerId: number | null = null;
  employesDisponibles: Employe[] = [];

  private userService = inject(UserService);

  constructor(
    public dialogRef: MatDialogRef<AssignManagerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignManagerData
  ) {}

  ngOnInit(): void {
    
    this.selectedManagerId = this.data.managerId || null;

    
    this.chargerEmployesDisponibles();
  }

  chargerEmployesDisponibles(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        
        const assignedManagerIds = new Set(
          (this.data.allOrgs || [])
            .map(o => o.managerId || o.manager?.id)
            .filter(id => id !== null && id !== undefined)
        );

        
        this.employesDisponibles = users.filter(emp => 
          !assignedManagerIds.has(emp.id) || emp.id === this.data.managerId
        );
      },
      error: (err) => console.error('Erreur chargement utilisateurs:', err)
    });
  }
}
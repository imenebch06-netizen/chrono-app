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
    MatIconModule
  ],
  templateUrl: './mes-employes.component.html'
})
export class MesEmployesComponent implements OnInit {

  @ViewChild('maTable') dataTable!: DataTableTestComponent;
  
  private authService = inject(AuthService);
  public isReadOnly: boolean = false;
  public filtreEtatActif: string = 'TOUS';
  // 🟢 Sécurité : On initialise par défaut à 'TEAM'
  public viewMode: 'ALL' | 'TEAM' | 'WITHOUT_PLANNING' = 'TEAM';

  ngOnInit(): void {
    const userRole = (this.authService.getUserRole() || '').toUpperCase();
    const currentUser = this.authService.getUser();

    const isAdmin = userRole === 'ADMIN';

    // 🟢 Même vérification complète que dans la Sidebar
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
      this.isReadOnly = false; // 🟢 L'admin peut faire tout le CRUD
    } else if (isManager) {
      this.viewMode = 'TEAM';
      this.isReadOnly = true;  // 🔴 Le manager passe en lecture seule (pas d'ajout/modif/suppression)
    } else {
      this.viewMode = 'TEAM';
      this.isReadOnly = true;
    }
  }

  filtrerTable(event: Event): void {
    if (this.dataTable) {
      this.dataTable.appliquerFiltre(event);
    }
  }

  ajouterEmploye(): void {
    if (this.dataTable && !this.isReadOnly) {
      this.dataTable.ajouterUnEmploye();
    }
  }

  filtrerParEtat(etat: string): void {
  this.filtreEtatActif = etat;
  if (this.dataTable) {
    this.dataTable.filtrerParEtat(etat);
  }
}
}
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TablerIconsModule } from 'angular-tabler-icons';

import { PointageService, Pointage } from 'src/app/services/pointage.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-pointages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    TablerIconsModule
  ],
  templateUrl: './pointages.component.html'
})
export class PointagesComponent implements OnInit {
  private pointageService = inject(PointageService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  public isAdmin: boolean = false;
  
  // Filtre de date journalier
  public selectedDate: string = new Date().toISOString().split('T')[0];

  // Données de la table
  public dataSource = new MatTableDataSource<Pointage>([]);
  public displayedColumns: string[] = ['employe', 'date', 'heureDebut', 'heureFin', 'dureeHeures', 'creditDebit'];

  public isUploading: boolean = false;

  ngOnInit(): void {
    const role = (this.authService.getUserRole() || '').toUpperCase();
    this.isAdmin = role === 'ADMIN';

    this.chargerPointages();
  }

  chargerPointages(): void {
    if (this.isAdmin) {
      // 🟢 Admin : Récupère tous les pointages globaux de la date
      this.pointageService.getPointagesParDate(this.selectedDate).subscribe({
        next: (res) => this.dataSource.data = res.pointages || [],
        error: () => this.notifier('❌ Erreur lors de la récupération des pointages', true)
      });
    } else {
      // 🔵 Employé responsable d'organisation : Récupère les pointages de ses subordonnés
      this.pointageService.getMonEquipe(this.selectedDate).subscribe({
        next: (res) => this.dataSource.data = res.pointages || [],
        error: () => this.notifier('❌ Erreur lors de la récupération des pointages de votre équipe', true)
      });
    }
  }

  // 🟢 IMPORTATION EXCEL (ADMIN SEULEMENT)
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploading = true;

    this.pointageService.importerPointagesExcel(file).subscribe({
      next: (res) => {
        this.isUploading = false;
        this.notifier(`✅ ${res.message || 'Importation réussie avec succès !'}`);
        this.chargerPointages();
        input.value = '';
      },
      error: (err) => {
        this.isUploading = false;
        const msg = err.error?.message || 'Erreur lors de l\'importation du fichier Excel';
        this.notifier(`❌ ${msg}`, true);
        input.value = '';
      }
    });
  }

  private notifier(message: string, estErreur: boolean = false): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 4500,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: estErreur ? ['snack-bar-erreur'] : ['snack-bar-succes']
    });
  }
}
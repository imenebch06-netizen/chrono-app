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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
    TranslateModule,
    TablerIconsModule
  ],
  templateUrl: './pointages.component.html'
})
export class PointagesComponent implements OnInit {
  private pointageService = inject(PointageService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private translateService = inject(TranslateService);

  public isAdmin: boolean = false;
  
  public selectedDate: string = new Date().toISOString().split('T')[0];

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
      this.pointageService.getPointagesParDate(this.selectedDate).subscribe({
        next: (res) => this.dataSource.data = res.pointages || [],
        error: () => this.notifier(this.translateService.instant('POINTAGES-GL.ERR_FETCH_POINTAGES'), true)
      });
    } else {
      this.pointageService.getMonEquipe(this.selectedDate).subscribe({
        next: (res) => this.dataSource.data = res.pointages || [],
        error: () => this.notifier(this.translateService.instant('POINTAGES-GL.ERR_FETCH_TEAM'), true)
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploading = true;

    this.pointageService.importerPointagesExcel(file).subscribe({
      next: (res) => {
        this.isUploading = false;
        const msgSuccess = res.message || this.translateService.instant('POINTAGES-GL.IMPORT_SUCCESS');
        this.notifier(`✅ ${msgSuccess}`);
        this.chargerPointages();
        input.value = '';
      },
      error: (err) => {
        this.isUploading = false;
        const msgErr = err.error?.message || this.translateService.instant('POINTAGES-GL.ERR_IMPORT');
        this.notifier(`❌ ${msgErr}`, true);
        input.value = '';
      }
    });
  }

  private notifier(message: string, estErreur: boolean = false): void {
    const closeLabel = this.translateService.instant('POINTAGES-GL.CLOSE');
    this.snackBar.open(message, closeLabel, {
      duration: 4500,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: estErreur ? ['snack-bar-erreur'] : ['snack-bar-succes']
    });
  }
}
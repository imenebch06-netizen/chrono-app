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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PointageService, Pointage } from 'src/app/services/pointage.service';

@Component({
  selector: 'app-mes-pointages',
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
    TablerIconsModule,
    TranslateModule
  ],
  templateUrl: './mes-pointages.component.html'
})
export class MesPointagesComponent implements OnInit {
  private pointageService = inject(PointageService);
  private snackBar = inject(MatSnackBar);
  private translateService = inject(TranslateService);

  // Filtre semaine (Lundi)
  public selectedWeekStart: string = this.getStartOfWeek(new Date());

  // Données
  public dataSource = new MatTableDataSource<Pointage>([]);
  public displayedColumns: string[] = ['employe', 'date', 'heureDebut', 'heureFin', 'dureeHeures', 'creditDebit'];
  public summaryHebdo: any = null;

  ngOnInit(): void {
    this.chargerMesPointages();
  }

  chargerMesPointages(): void {
    this.pointageService.getMaSemaine(this.selectedWeekStart).subscribe({
      next: (res) => {
        this.dataSource.data = res.pointages || [];
        this.summaryHebdo = res;
      },
      error: () => this.notifier(this.translateService.instant('POINTAGES.SNACKBAR.ERROR_LOADING_WEEK'), true)
    });
  }

  private notifier(message: string, estErreur: boolean = false): void {
    this.snackBar.open(message, this.translateService.instant('POINTAGES.SNACKBAR.CLOSE'), {
      duration: 4500,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: estErreur ? ['snack-bar-erreur'] : ['snack-bar-succes']
    });
  }

  private getStartOfWeek(d: Date): string {
  const date = new Date(d);
  const day = date.getDay(); 
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff)).toISOString().split('T')[0];
}
}
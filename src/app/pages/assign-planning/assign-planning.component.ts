import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DataTableTestComponent } from '../../components/data-table/data-table.component';
import { PlanningService } from '../../services/planning.service';

@Component({
  selector: 'app-assign-planning',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    DataTableTestComponent,
    TranslateModule
  ],
  templateUrl: './assign-planning.component.html',
  styleUrls: ['./assign-planning.component.scss']
})
export class AssignPlanningComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private planningService = inject(PlanningService);
  private translateService = inject(TranslateService);

  @ViewChild('dataTable') dataTable!: DataTableTestComponent;

  planningForm!: FormGroup;

  joursSemaine = [
    { labelKey: 'ASSIGN_PLANNING.DAYS.MONDAY', value: 1 },
    { labelKey: 'ASSIGN_PLANNING.DAYS.TUESDAY', value: 2 },
    { labelKey: 'ASSIGN_PLANNING.DAYS.WEDNESDAY', value: 3 },
    { labelKey: 'ASSIGN_PLANNING.DAYS.THURSDAY', value: 4 },
    { labelKey: 'ASSIGN_PLANNING.DAYS.FRIDAY', value: 5 },
    { labelKey: 'ASSIGN_PLANNING.DAYS.SATURDAY', value: 6 },
    { labelKey: 'ASSIGN_PLANNING.DAYS.SUNDAY', value: 0 }
  ];

  ngOnInit(): void {
    this.planningForm = this.fb.group({
      dateDebut: ['2026-08-01', Validators.required],
      dateFin: ['2026-08-31', Validators.required],
      type_travail: ['NORMAL', Validators.required],
      typeShift: [null],
      heureDebut: ['08:00', Validators.required],
      heureFin: ['16:00', Validators.required],
      joursRepos: [[5, 6], Validators.required],
    });

    
    this.planningForm.get('type_travail')?.valueChanges.subscribe(type => {
      switch (type) {
        case 'NORMAL':
          this.planningForm.patchValue({
            typeShift: null,
            heureDebut: '08:00',
            heureFin: '16:00',
            joursRepos: [5, 6]
          });
          break;

        case 'WEEKEND_FERIE':
          this.planningForm.patchValue({
            typeShift: 'WEEKEND',
            heureDebut: '06:00',
            heureFin: '18:00',
            joursRepos: [1, 2]
          });
          break;

        case 'SHIFT_3X8':
          this.planningForm.patchValue({
            typeShift: 'MATIN',
            heureDebut: '06:00',
            heureFin: '14:00',
            joursRepos: [5, 6]
          });
          break;

        case 'SHIFT_4X6':
          this.planningForm.patchValue({
            typeShift: 'NUIT_PROFONDE',
            heureDebut: '00:00',
            heureFin: '06:00',
            joursRepos: []
          });
          break;

        case 'CONTINGENCE':
          this.planningForm.patchValue({
            typeShift: 'MAREE',
            heureDebut: '08:00',
            heureFin: '14:00',
            joursRepos: []
          });
          break;
      }
    });

    
    this.planningForm.get('typeShift')?.valueChanges.subscribe(shift => {
      const currentType = this.planningForm.get('type_travail')?.value;

      if (currentType === 'SHIFT_3X8') {
        if (shift === 'MATIN') this.planningForm.patchValue({ heureDebut: '06:00', heureFin: '14:00' });
        if (shift === 'SOIR')  this.planningForm.patchValue({ heureDebut: '14:00', heureFin: '22:00' });
        if (shift === 'NUIT')  this.planningForm.patchValue({ heureDebut: '22:00', heureFin: '06:00' });
      } else if (currentType === 'SHIFT_4X6') {
        if (shift === 'NUIT_PROFONDE') this.planningForm.patchValue({ heureDebut: '00:00', heureFin: '06:00' });
        if (shift === 'MATIN')        this.planningForm.patchValue({ heureDebut: '06:00', heureFin: '12:00' });
        if (shift === 'APRES_MIDI')   this.planningForm.patchValue({ heureDebut: '12:00', heureFin: '18:00' });
        if (shift === 'SOIR')         this.planningForm.patchValue({ heureDebut: '18:00', heureFin: '00:00' });
      }
    });
  }

  onSubmit(): void {
    const employesSelectionnes = this.dataTable?.selection?.selected || [];

    if (employesSelectionnes.length === 0) {
      this.snackBar.open(
        this.translateService.instant('ASSIGN_PLANNING.SNACKBAR.SELECT_AT_LEAST_ONE'),
        this.translateService.instant('ASSIGN_PLANNING.SNACKBAR.CLOSE'),
        { duration: 4000 }
      );
      return;
    }

    if (this.planningForm.invalid) return;

    const val = this.planningForm.value;
    const dateDebutISO = new Date(`${val.dateDebut}T00:00:00.000Z`).toISOString();
    const dateFinISO   = new Date(`${val.dateFin}T23:59:59.000Z`).toISOString();

    const listPlannings = employesSelectionnes.map(emp => {
      const item: any = {
        employeId: Number(emp.id),
        dateDebut: dateDebutISO,
        dateFin: dateFinISO,
        type_travail: val.type_travail,
        heureDebut: val.heureDebut,
        heureFin: val.heureFin,
        joursRepos: val.joursRepos,
      };

      if (val.typeShift) {
        item.typeShift = val.typeShift;
      }

      return item;
    });

    const payload = { planning: listPlannings };

    this.planningService.assignPlanning(payload).subscribe({
      next: () => {
        this.snackBar.open(
          this.translateService.instant('ASSIGN_PLANNING.SNACKBAR.SUCCESS'),
          this.translateService.instant('ASSIGN_PLANNING.SNACKBAR.OK'),
          { duration: 3000 }
        );

        const idsAssignes = employesSelectionnes.map(e => Number(e.id));
        this.dataTable.dataSource.data = this.dataTable.dataSource.data.filter(
          (emp: any) => !idsAssignes.includes(Number(emp.id))
        );
        this.dataTable.selection.clear();
      },
      error: (err) => {
        console.error('Erreur assignation planning:', err);
        this.snackBar.open(
          this.translateService.instant('ASSIGN_PLANNING.SNACKBAR.ERROR'),
          this.translateService.instant('ASSIGN_PLANNING.SNACKBAR.CLOSE'),
          { duration: 4000 }
        );
      },
    });
  }
}
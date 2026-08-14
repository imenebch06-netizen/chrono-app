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
    DataTableTestComponent
  ],
  templateUrl: './assign-planning.component.html',
  styleUrls: ['./assign-planning.component.scss']
})
export class AssignPlanningComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private planningService = inject(PlanningService);

  @ViewChild('dataTable') dataTable!: DataTableTestComponent;

  planningForm!: FormGroup;

  // Jours de repos (5 = Vendredi, 6 = Samedi par exemple)
  joursSemaine = [
    { label: 'Lundi', value: 1 },
    { label: 'Mardi', value: 2 },
    { label: 'Mercredi', value: 3 },
    { label: 'Jeudi', value: 4 },
    { label: 'Vendredi', value: 5 },
    { label: 'Samedi', value: 6 },
    { label: 'Dimanche', value: 0 }
  ];

  ngOnInit(): void {
    // 🟢 FORMULAIRE DIRECTEMENT SUR LA PAGE
    this.planningForm = this.fb.group({
      dateDebut: ['2026-08-01', Validators.required],
      dateFin: ['2026-08-31', Validators.required],
      type_travail: ['NORMAL', Validators.required],
      typeShift: ['MATIN'], // Uniquement pour SHIFT_3X8
      heureDebut: ['08:00', Validators.required],
      heureFin: ['16:00', Validators.required],
      joursRepos: [[5, 6], Validators.required],
    });

    // Ajustement automatique des horaires selon le type de travail sélectionné
    this.planningForm.get('type_travail')?.valueChanges.subscribe(type => {
      if (type === 'NORMAL') {
        this.planningForm.patchValue({ heureDebut: '08:00', heureFin: '16:00', typeShift: null });
      } else if (type === 'SHIFT_3X8') {
        this.planningForm.patchValue({ typeShift: 'MATIN', heureDebut: '06:00', heureFin: '14:00' });
      }
    });

    // Ajustement des horaires lors du changement de shift
    this.planningForm.get('typeShift')?.valueChanges.subscribe(shift => {
      if (shift === 'MATIN') this.planningForm.patchValue({ heureDebut: '06:00', heureFin: '14:00' });
      if (shift === 'SOIR')  this.planningForm.patchValue({ heureDebut: '14:00', heureFin: '22:00' });
      if (shift === 'NUIT')  this.planningForm.patchValue({ heureDebut: '22:00', heureFin: '06:00' });
    });
  }

  onSubmit(): void {
    // 1. Récupérer les employés cochés dans le tableau
    const employesSelectionnes = this.dataTable?.selection?.selected || [];

    if (employesSelectionnes.length === 0) {
      this.snackBar.open('⚠️ Veuillez sélectionner au moins un employé dans le tableau ci-dessous.', 'Fermer', { duration: 4000 });
      return;
    }

    if (this.planningForm.invalid) return;

    const val = this.planningForm.value;

    // 🟢 Formatage ISO propre des dates (T00:00:00.000Z et T23:59:59.000Z)
    const dateDebutISO = new Date(`${val.dateDebut}T00:00:00.000Z`).toISOString();
    const dateFinISO   = new Date(`${val.dateFin}T23:59:59.000Z`).toISOString();

    // 🟢 Génération du tableau d'objets JSON exact
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

      // Si type_travail est SHIFT_3X8, on inclut le typeShift
      if (val.type_travail === 'SHIFT_3X8' && val.typeShift) {
        item.typeShift = val.typeShift;
      }

      return item;
    });

    const payload = { planning: listPlannings };

  this.planningService.assignPlanning(payload).subscribe({
    next: () => {
      this.snackBar.open('✅ Planning assigné avec succès !', 'OK', { duration: 3000 });

      // 🟢 1. Récupérer les IDs des employés qui viennent d'être assignés
      const idsAssignes = employesSelectionnes.map(e => Number(e.id));

      // 🟢 2. Retirer instantanément ces employés du tableau affiché
      this.dataTable.dataSource.data = this.dataTable.dataSource.data.filter(
        (emp: any) => !idsAssignes.includes(Number(emp.id))
      );

      // 🟢 3. Vider la sélection (décocher les cases)
      this.dataTable.selection.clear();
    },
    error: (err) => {
      console.error('Erreur assignation planning:', err);
      this.snackBar.open('❌ Erreur lors de l\'assignation du planning.', 'Fermer', { duration: 4000 });
    },
  });
  }
}
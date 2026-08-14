import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DemandeAbsenceService, DemandeAbsence, StatutDemande, TypeDemande } from 'src/app/services/demande-absence.service';
import { AuthService } from 'src/app/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-demandes',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    
  ],
  templateUrl: './demandes.component.html',
})
export class DemandesComponent implements OnInit {
  private demandeService = inject(DemandeAbsenceService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
 private snackBar = inject(MatSnackBar);

  // Signals pour la réactivité
  mesDemandes = signal<DemandeAbsence[]>([]);
  demandesAValider = signal<DemandeAbsence[]>([]);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  selectedFile: File | null = null;

  // Formulaire
  demandeForm!: FormGroup;

  // Rôles
  isManager = signal<boolean>(false);
  isAdmin = signal<boolean>(false);

  typesDemande = Object.values(TypeDemande);
  statuts = StatutDemande;
  minDate!: string;
  maxDate!: string;

  ngOnInit(): void {
  this.initForm();
  this.checkUserRoleAndLoadData();

  const today = new Date();

  // Date minimale = demain
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  this.minDate = tomorrow.toISOString().split('T')[0];

  // Date maximale = dans 1 an
  const max = new Date(today);
  max.setFullYear(today.getFullYear() + 1);
  this.maxDate = max.toISOString().split('T')[0];
  }


  private initForm(): void {
    this.demandeForm = this.fb.group({
      typeDemande: [TypeDemande.CONGE, [Validators.required]],
      dateDebut: ['', [Validators.required]],
      dateFin: ['', [Validators.required]],
      motif: ['', [Validators.required]],
      type_conge: ['Congé payé'],
      heures_a_recuperer: [null],
    });

    // Adapter les validations dynamiquement selon le type de demande
    this.demandeForm.get('typeDemande')?.valueChanges.subscribe((type) => {
      const typeCongeCtrl = this.demandeForm.get('type_conge');
      const heuresCtrl = this.demandeForm.get('heures_a_recuperer');
      const dateFinCtrl = this.demandeForm.get('dateFin');
      if (type === TypeDemande.CONGE) {
        typeCongeCtrl?.setValidators([Validators.required]);
        heuresCtrl?.clearValidators();
        dateFinCtrl?.setValidators([Validators.required]);
      } else if (type === TypeDemande.RECUPERATION) {
        heuresCtrl?.setValidators([Validators.required, Validators.min(0.5),Validators.max(8)]);
        typeCongeCtrl?.clearValidators();
        dateFinCtrl?.clearValidators();
      } else {
        typeCongeCtrl?.clearValidators();
        heuresCtrl?.clearValidators();
        dateFinCtrl?.setValidators([Validators.required]);
      }
      typeCongeCtrl?.updateValueAndValidity();
      heuresCtrl?.updateValueAndValidity();
      dateFinCtrl?.updateValueAndValidity();
    });
  }

  private checkUserRoleAndLoadData(): void {
    this.isLoading.set(true);
    
    // Récupération du profil
    this.authService.getProfile().subscribe({
      next: (user: any) => {
        const profile = user?.data || user?.user || user;
        this.isAdmin.set(profile?.role === 'ADMIN');
        this.isManager.set(Boolean(profile?.organizationGeree || profile?.isManager));

        this.loadMesDemandes();

        if (this.isAdmin()) {
          this.loadPendingAdmin();
        } else if (this.isManager()) {
          this.loadPendingManager();
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadMesDemandes(): void {
    this.demandeService.getMesDemandes().subscribe({
      next: (data) => {
        this.mesDemandes.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadPendingManager(): void {
    this.demandeService.getPendingForMyTeam().subscribe({
      next: (data) => this.demandesAValider.set(data),
      error: (err) => console.error(err),
    });
  }

  loadPendingAdmin(): void {
    this.demandeService.getAllPending().subscribe({
      next: (data) => this.demandesAValider.set(data),
      error: (err) => console.error(err),
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onSubmit(): void {
    if (this.demandeForm.invalid) return;

    this.isSubmitting.set(true);
    const formData = new FormData();
    const formValues = { ...this.demandeForm.value };

    if (formValues.typeDemande === TypeDemande.RECUPERATION) {
      formValues.dateFin = formValues.dateDebut;
    }

    Object.keys(formValues).forEach((key) => {
      if (formValues[key] !== null && formValues[key] !== undefined) {
        formData.append(key, formValues[key]);
      }
    });

    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.demandeService.createDemande(formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.demandeForm.reset({ typeDemande: TypeDemande.CONGE, type_conge: 'Congé payé' });
        this.selectedFile = null;
        this.loadMesDemandes();
        // ✅ Snackbar succès
      this.snackBar.open('Demande envoyée avec succès !', 'Fermer', {
        duration: 4000,
        panelClass: ['snack-success']
      });
      },
      error: (err) => {
       this.isSubmitting.set(false);

      // ✅ Récupération du message NestJS
      const errorMessage = err.error?.message || "Une erreur est survenue lors de la création.";
      const displayMsg = Array.isArray(errorMessage) ? errorMessage[0] : errorMessage;
        this.snackBar.open(displayMsg, 'Fermer', {
        duration: 6000,
        panelClass: ['snack-error']
      });
      },
    });
  }

  annulerDemande(id: number): void {
    if (confirm('Voulez-vous vraiment annuler cette demande ?')) {
      this.demandeService.annulerMaDemande(id).subscribe({
        next: () => this.loadMesDemandes(),
      });
    }
  }

  traiterDemande(id: number, status: StatutDemande): void {
    this.demandeService.updateStatus(id, status).subscribe({
      next: () => {
        if (this.isAdmin()) this.loadPendingAdmin();
        else if (this.isManager()) this.loadPendingManager();
      },
    });
  }
}
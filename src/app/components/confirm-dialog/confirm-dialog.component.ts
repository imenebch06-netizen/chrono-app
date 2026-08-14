// confirm-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-6 max-w-md">
      <!-- En-tête avec Icône d'avertissement -->
      <div class="flex items-center gap-4 mb-4 text-rose-600">
        <div class="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0">
          <mat-icon class="!w-6 !h-6 !text-2xl">warning_amber</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-800 m-0 leading-tight">
            {{ data.title || 'Confirmer la suppression' }}
          </h2>
          <span class="text-xs font-semibold text-rose-500">Action irréversible</span>
        </div>
      </div>

      <!-- Message -->
      <p class="text-sm text-slate-600 mb-6 leading-relaxed">
        {{ data.message || 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action ne pourra pas être annulée.' }}
      </p>

      <!-- Boutons d'action -->
      <div class="flex items-center justify-end gap-3">
        <button 
          type="button"
          [mat-dialog-close]="false"
          class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
          {{ data.cancelText || 'Annuler' }}
        </button>
        <button 
          type="button"
          [mat-dialog-close]="true"
          class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all">
          {{ data.confirmText || 'Supprimer' }}
        </button>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export interface ConfirmDialogData {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    <div class="p-6 max-w-md bg-[var(--mat-sys-surface)] text-[var(--mat-sys-on-background)]">
      <!-- En-tête avec Icône d'avertissement -->
      <div class="flex items-center gap-4 mb-4 text-rose-500">
        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
          <mat-icon class="!w-6 !h-6 !text-2xl text-rose-500">warning_amber</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-[var(--mat-sys-on-background)] m-0 leading-tight">
            {{ data.title || ('CONFIRM_DIALOG.DEFAULT_TITLE' | translate) }}
          </h2>
          <span class="text-xs font-semibold text-rose-500">
            {{ 'CONFIRM_DIALOG.IRREVERSIBLE_ACTION' | translate }}
          </span>
        </div>
      </div>

      <!-- Message -->
      <p class="text-sm text-[var(--mat-sys-on-background)]/70 mb-6 leading-relaxed">
        {{ data.message || ('CONFIRM_DIALOG.DEFAULT_MESSAGE' | translate) }}
      </p>

      <!-- Boutons d'action -->
      <div class="flex items-center justify-end gap-3">
        <button 
          type="button"
          [mat-dialog-close]="false"
          class="px-4 py-2 rounded-xl text-xs font-bold text-[var(--mat-sys-on-background)] bg-[var(--mat-sys-outline)]/20 hover:bg-[var(--mat-sys-outline)]/35 transition-colors">
          {{ data.cancelText || ('CONFIRM_DIALOG.DEFAULT_CANCEL' | translate) }}
        </button>
        <button 
          type="button"
          [mat-dialog-close]="true"
          class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all">
          {{ data.confirmText || ('CONFIRM_DIALOG.DEFAULT_CONFIRM' | translate) }}
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
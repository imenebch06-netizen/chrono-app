import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export type AuthMode = 'LOGIN' | 'FORGOT' | 'RESET';

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, TablerIconsModule, TranslateModule],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  mode: AuthMode = 'LOGIN';
  resetToken = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  isVerifyingToken = false;
  isTokenValid = true;

  form = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    newPassword: new FormControl(''),
  });

  ngOnInit(): void {
    // Détection du token dans l'URL
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      if (token) {
        this.mode = 'RESET';
        this.resetToken = token;
        this.verifyTokenValidity(token);

        this.form.get('password')?.clearValidators();
        this.form.get('password')?.updateValueAndValidity();
        this.form.get('uname')?.clearValidators();
        this.form.get('uname')?.updateValueAndValidity();
        this.form.get('newPassword')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.form.get('newPassword')?.updateValueAndValidity();
      }
    });
  }

  private verifyTokenValidity(token: string): void {
    this.isVerifyingToken = true;
    this.authService.verifyResetToken(token).subscribe({
      next: () => {
        this.isVerifyingToken = false;
        this.isTokenValid = true;
      },
      error: () => {
        this.isVerifyingToken = false;
        this.isTokenValid = false;
      },
    });
  }

  switchMode(newMode: AuthMode): void {
    this.mode = newMode;
    this.errorMessage = '';
    this.successMessage = '';
    this.isTokenValid = true;

    // Supprime le paramètre token de l'URL si on change de mode
    this.router.navigate([], { queryParams: {} });

    if (newMode === 'FORGOT') {
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      this.form.get('uname')?.setValidators([Validators.required, Validators.email]);
      this.form.get('uname')?.updateValueAndValidity();
    } else if (newMode === 'LOGIN') {
      this.form.get('password')?.setValidators([Validators.required]);
      this.form.get('password')?.updateValueAndValidity();
      this.form.get('uname')?.setValidators([Validators.required, Validators.email]);
      this.form.get('uname')?.updateValueAndValidity();
    }
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.mode === 'LOGIN') {
      this.handleLogin();
    } else if (this.mode === 'FORGOT') {
      this.handleForgotPassword();
    } else if (this.mode === 'RESET') {
      this.handleResetPassword();
    }
  }

  private handleLogin(): void {
    if (this.form.get('uname')?.invalid || this.form.get('password')?.invalid) return;

    this.isLoading = true;
    const credentials = {
      email: this.form.value.uname!.trim().toLowerCase(),
      password: this.form.value.password!,
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/profil']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || this.translate.instant('AUTH.DEFAULT_ERROR');
      },
    });
  }

  private handleForgotPassword(): void {
    if (this.form.get('uname')?.invalid) return;

    this.isLoading = true;
    const email = this.form.value.uname!;

    this.authService.forgotPassword(email).subscribe({
      next: async (res) => {
        const resetLink = `${window.location.origin}/authentication/login?token=${res.resetToken}`;
        try {
          await this.authService.sendResetEmail(email, resetLink);
          this.isLoading = false;
          this.successMessage = 'Un e-mail de réinitialisation vous a été envoyé.';
        } catch (emailErr) {
          this.isLoading = false;
          this.errorMessage = "Erreur lors de l'envoi de l'e-mail EmailJS.";
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Email non trouvé.';
      },
    });
  }

  private handleResetPassword(): void {
    if (this.form.get('newPassword')?.invalid) return;

    this.isLoading = true;
    const newPassword = this.form.value.newPassword!;

    this.authService.resetPassword({ token: this.resetToken, newPassword }).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Mot de passe mis à jour avec succès', 'Fermer', { duration: 4000 });
        this.router.navigate([], { queryParams: {} });
        this.switchMode('LOGIN');
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Token invalide ou expiré.';
      },
    });
  }
}
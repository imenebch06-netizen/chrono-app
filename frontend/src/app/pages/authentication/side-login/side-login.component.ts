import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module'; // Ou tes imports Material
import { AuthService } from 'src/app/services/auth.service';
import { MatTabsModule } from '@angular/material/tabs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule,TablerIconsModule],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

// 💡 Méthode déclenchée lors du clic sur "Mot de passe oublié ?"
motDePasseOublie(): void {
  this.snackBar.open(
    '🔒 Pour réinitialiser votre mot de passe, veuillez contacter votre administrateur ou le service RH.',
    'Compris',
    {
      duration: 6000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    }
  );
}
  errorMessage = '';
  isLoading = false;

  // Formulaire Reactive Form
  form = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  submit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = {
      email: this.form.value.uname!,
      password: this.form.value.password!,
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        // 🚀 Redirection vers la page des employés
        this.router.navigate(['/profil']); 
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Identifiants incorrects';
      },
    });
  }
}
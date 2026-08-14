import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService, Employe } from 'src/app/services/user.service';

@Component({
  selector: 'app-details-employe',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    UpperCasePipe
  ],
  templateUrl: './details-employe.component.html'
})
export class DetailsEmployeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);

  user = signal<Employe | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.userService.getUserById(id).subscribe({
        next: (emp) => {
          this.user.set(emp);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'employé:', err);
          this.isLoading.set(false);
        }
      });
    }
  }
}
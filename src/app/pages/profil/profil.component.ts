import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TablerIconComponent } from 'angular-tabler-icons';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from 'src/app/services/auth.service';
import { OrganizationService } from 'src/app/services/organization.service';
import { Role } from 'src/app/services/user.service';

interface TypeOrganization {
  id: number;
  code: string;
  libelle: string;
}

interface OrganizationLite {
  id?: number;
  nom?: string;
  path?: string;
  typeOrganization?: TypeOrganization;
}

interface EmployeProfil {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  adress?: string | null;
  role: Role;
  organization?: OrganizationLite | null;
  organizationGeree?: OrganizationLite | null;
  createdAt?: string | Date;
}

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    TablerIconComponent
  ],
  templateUrl: './profil.component.html',
})
export class ProfilComponent implements OnInit {
  private authService = inject(AuthService);
  private organizationService = inject(OrganizationService);

  user = signal<EmployeProfil | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const profile$ = this.authService.getProfile().pipe(
      catchError((err) => {
        console.error('❌ Erreur HTTP getProfile:', err);
        return of(null);
      })
    );

    const orgs$ = this.organizationService.getOrganizations().pipe(
      catchError(() => of([]))
    );

    forkJoin({ rawRes: profile$, organizations: orgs$ }).subscribe({
      next: ({ rawRes, organizations }) => {
        // 🟢 Cast en `any` pour autoriser la lecture dynamique sans erreur TypeScript
        const resAny = rawRes as any;
        const profileData = resAny?.data || resAny?.user || resAny?.employe || rawRes;

        if (!profileData || !profileData.id) {
          console.error('❌ Objet Profil introuvable dans la réponse :', rawRes);
          this.errorMessage.set('Impossible de charger les données du profil.');
          this.isLoading.set(false);
          return;
        }

        const userProfil: EmployeProfil = { ...profileData };

        // 🟢 Récupération & enrichissement de l'organisation de rattachement
        const orgId = userProfil.organization?.id || (userProfil as any).organizationId;
        if (orgId && organizations?.length) {
          const fullOrg = organizations.find((o: any) => Number(o.id) === Number(orgId));
          if (fullOrg) {
            userProfil.organization = {
              id: fullOrg.id,
              nom: fullOrg.nom,
              path: fullOrg.fullPath || (fullOrg as any).path,
              typeOrganization: fullOrg.typeOrganization
            };
          }
        }

        // 🟢 Détection de l'organisation gérée (si l'utilisateur est Manager)
        if (!userProfil.organizationGeree && organizations?.length) {
          const orgGeree = organizations.find((o: any) => 
            Number(o.managerId) === Number(userProfil.id) || 
            Number(o.manager?.id) === Number(userProfil.id)
          );

          if (orgGeree) {
            userProfil.organizationGeree = {
              id: orgGeree.id,
              nom: orgGeree.nom,
              path: orgGeree.fullPath || (orgGeree as any).path,
              typeOrganization: orgGeree.typeOrganization
            };
          }
        }

        this.user.set(userProfil);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Erreur générale :', err);
        this.errorMessage.set('Erreur lors du chargement de la page.');
        this.isLoading.set(false);
      }
    });
  }
}
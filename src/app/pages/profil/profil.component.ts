import { Component, OnInit, AfterViewInit, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TablerIconComponent } from 'angular-tabler-icons';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as L from 'leaflet';

import { AuthService } from 'src/app/services/auth.service';
import { OrganizationService } from 'src/app/services/organization.service';
import { Role } from 'src/app/services/user.service';
import { LanguageService } from 'src/app/services/language.service';

// Correction icône Leaflet
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

interface TypeOrganization {
  id: number;
  code: string;
  libelle: string;
}

interface OrganizationLite {
  id?: number;
  nom?: string;
  nom_en?: string | null;
  path?: string;
  typeOrganization?: TypeOrganization;
}

interface EmployeProfil {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  adress?: string | null;
  adress_en?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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
    TranslateModule,
    TablerIconComponent
  ],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.scss']
})
export class ProfilComponent implements OnInit {
  private authService = inject(AuthService);
  private organizationService = inject(OrganizationService);
  private translateService = inject(TranslateService);
  public languageService = inject(LanguageService);

  readonly BEJAIA_LAT = 36.7510;
  readonly BEJAIA_LNG = 5.0567;

  user = signal<EmployeProfil | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  private map!: L.Map;

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
        const resAny = rawRes as any;
        const profileData = resAny?.data || resAny?.user || resAny?.employe || rawRes;

        if (!profileData || !profileData.id) {
          console.error('❌ Objet Profil introuvable dans la réponse :', rawRes);
          this.errorMessage.set(this.translateService.instant('PROFIL.ERR_LOAD_DATA'));
          this.isLoading.set(false);
          return;
        }

        const userProfil: EmployeProfil = { ...profileData };

        const orgId = userProfil.organization?.id || (userProfil as any).organizationId;
        if (orgId && organizations?.length) {
          const fullOrg = organizations.find((o: any) => Number(o.id) === Number(orgId));
          if (fullOrg) {
            userProfil.organization = {
              id: fullOrg.id,
              nom: fullOrg.nom,
              nom_en: fullOrg.nom_en,
              path: fullOrg.fullPath || (fullOrg as any).path,
              typeOrganization: fullOrg.typeOrganization
            };
          }
        }

        if (!userProfil.organizationGeree && organizations?.length) {
          const orgGeree = organizations.find((o: any) =>
            Number(o.managerId) === Number(userProfil.id) ||
            Number(o.manager?.id) === Number(userProfil.id)
          );

          if (orgGeree) {
            userProfil.organizationGeree = {
              id: orgGeree.id,
              nom: orgGeree.nom,
              nom_en: orgGeree.nom_en,
              path: orgGeree.fullPath || (orgGeree as any).path,
              typeOrganization: orgGeree.typeOrganization
            };
          }
        }

        this.user.set(userProfil);
        this.isLoading.set(false);

        // Initialisation de la carte une fois le DOM rendu
        setTimeout(() => this.initMap(), 100);
      },
      error: (err) => {
        console.error('❌ Erreur générale :', err);
        this.errorMessage.set(this.translateService.instant('PROFIL.ERR_LOAD_PAGE'));
        this.isLoading.set(false);
      }
    });
  }

  private initMap(): void {
    const profile = this.user();
    if (!profile) return;

    const lat = profile.latitude || this.BEJAIA_LAT;
    const lng = profile.longitude || this.BEJAIA_LNG;
    const mapElement = document.getElementById('profile-map');

    if (!mapElement) return;

    this.map = L.map('profile-map', {
      center: [lat, lng],
      zoom: profile.latitude ? 14 : 11,
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    if (profile.latitude && profile.longitude) {
      const addressLabel = this.languageService.isFrench()
        ? (profile.adress || 'Position enregistrée')
        : (profile.adress_en || profile.adress || 'Saved Location');

      L.marker([lat, lng])
        .addTo(this.map)
        .bindPopup(`<b>${profile.prenom} ${profile.nom}</b><br>${addressLabel}`);
    }
  }
}
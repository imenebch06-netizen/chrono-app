import { Component, Inject, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as L from 'leaflet';
import { LocationService } from 'src/app/services/location.service';

// Correction des icônes Leaflet sous Angular
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

@Component({
  selector: 'app-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss']
})
export class MonFormDialogComponent implements OnInit, AfterViewInit {
  private locationService = inject(LocationService);
  private translate = inject(TranslateService);

  readonly BEJAIA_LAT = 36.7510;
  readonly BEJAIA_LNG = 5.0567;

  private map!: L.Map;
  private marker!: L.Marker;

  selectedAddressLang: 'fr' | 'en' = 'fr';
  roles = [
    { value: 'EMPLOYE', labelKey: 'EMPLOYEE_FORM.ROLES.EMPLOYEE' },
    { value: 'ADMIN', labelKey: 'EMPLOYEE_FORM.ROLES.ADMIN' }
  ];
  organizationsList: any[] = [];

  formData: any = {
    id: null,
    nom: '',
    prenom: '',
    email: '',
    password: '',
    adress: '',
    adress_en: '',
    latitude: null,
    longitude: null,
    role: 'EMPLOYE',
    organizationId: null
  };

  constructor(
    public dialogRef: MatDialogRef<MonFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const emp = data?.employee || (data?.id ? data : null);

  if (emp) {
    this.formData = { 
      ...emp, 
      password: '' 
    };
  }

  if (data?.organizations) {
    this.organizationsList = data.organizations;
  }
  }

  ngOnInit(): void {
    const currentAppLang = this.translate.currentLang || 'fr';
    this.selectedAddressLang = currentAppLang === 'en' ? 'en' : 'fr';
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  get currentAddress(): string {
    return this.selectedAddressLang === 'fr'
      ? (this.formData.adress || '')
      : (this.formData.adress_en || '');
  }

  set currentAddress(val: string) {
    if (this.selectedAddressLang === 'fr') {
      this.formData.adress = val;
    } else {
      this.formData.adress_en = val;
    }
  }

  private initMap(): void {
    const initialLat = this.formData.latitude || this.BEJAIA_LAT;
    const initialLng = this.formData.longitude || this.BEJAIA_LNG;
    const zoomLevel = this.formData.latitude ? 15 : 12;

    this.map = L.map('map').setView([initialLat, initialLng], zoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.updatePositionAndAddresses(e.latlng.lat, e.latlng.lng);
    });

    this.marker.on('dragend', () => {
      const pos = this.marker.getLatLng();
      this.updatePositionAndAddresses(pos.lat, pos.lng);
    });
  }

  private updatePositionAndAddresses(lat: number, lng: number): void {
    this.formData.latitude = parseFloat(lat.toFixed(6));
    this.formData.longitude = parseFloat(lng.toFixed(6));
    this.marker.setLatLng([lat, lng]);

    this.locationService.getAddressInBothLanguages(lat, lng).subscribe({
      next: ({ fr, en }) => {
        this.formData.adress = fr?.display_name || '';
        this.formData.adress_en = en?.display_name || '';
      }
    });
  }

 

searchAddressOnMap(): void {
  let query = this.currentAddress;
  if (!query) return;

  
  if (!query.toLowerCase().includes('algerie') && !query.toLowerCase().includes('dz')) {
    query += ', Béjaïa, Algérie';
  }

  this.locationService.getCoordsFromAddress(query, this.selectedAddressLang).subscribe({
    next: (results) => {
      if (results && results.length > 0) {
        const topResult = results[0];
        const lat = parseFloat(topResult.lat);
        const lng = parseFloat(topResult.lon);

        
        this.map.setView([lat, lng], 15);
        this.updatePositionAndAddresses(lat, lng);
      }
    }
  });
}

  fermer(): void {
    this.dialogRef.close();
  }

  soumettreFormulaire(): void {
    this.dialogRef.close(this.formData);
  }
}
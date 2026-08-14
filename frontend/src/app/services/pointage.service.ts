import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Pointage {
  id: number;
  date: string;
  heureDebut: string;
  heureFin?: string;
  dureeHeures?: number;
  creditDebit?: number;
  employeId: number;
  employe?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    organization?: { id: number; nom: string };
  };
}

@Injectable({
  providedIn: 'root'
})
export class PointageService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pointages`;

  /**
   * Importer un fichier Excel de pointages (Admin uniquement)
   */
  importerPointagesExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/import`, formData);
  }

  /**
   * Récupérer tous les pointages d'une date (Admin)
   */
  getPointagesParDate(dateStr: string): Observable<any> {
    const params = new HttpParams().set('date', dateStr);
    return this.http.get<any>(`${this.apiUrl}/date`, { params });
  }

  /**
   * Récupérer ses propres pointages pour une semaine (Employé / Manager / Admin)
   */
  getMaSemaine(dateDebutStr: string): Observable<any> {
    const params = new HttpParams().set('dateDebut', dateDebutStr);
    return this.http.get<any>(`${this.apiUrl}/ma-semaine`, { params });
  }

  /**
   * Récupérer les pointages de son équipe pour une date (Manager / Admin)
   */
  getMonEquipe(dateStr: string): Observable<any> {
    const params = new HttpParams().set('date', dateStr);
    return this.http.get<any>(`${this.apiUrl}/mon-equipe`, { params });
  }
}
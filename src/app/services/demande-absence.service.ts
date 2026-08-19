import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

export enum StatutDemande {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  REFUSE = 'REFUSE',
}

export enum TypeDemande {
  CONGE = 'CONGE',
  ABSENCE = 'ABSENCE',
  RECUPERATION = 'RECUPERATION',
}

export interface DemandeAbsence {
  id: number;
  typeDemande: TypeDemande;
  dateDebut: string;
  dateFin: string;
  motif: string;
  justificatif?: string;
  status: StatutDemande;
  type_conge?: string;
  justifie?: boolean;
  heures_a_recuperer?: number;
  createdAt: string;
  employe?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    organization?: { id: number; nom: string };
  };
}

@Injectable({
  providedIn: 'root',
})
export class DemandeAbsenceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/demandes-absence`;

  // 1. Soumettre une demande (avec support de fichier)
  createDemande(formData: FormData): Observable<DemandeAbsence> {
    return this.http.post<DemandeAbsence>(this.apiUrl, formData);
  }

  // 2. Récupérer mes demandes
  getMesDemandes(): Observable<DemandeAbsence[]> {
    return this.http.get<DemandeAbsence[]>(`${this.apiUrl}/mes-demandes`);
  }

  // 3. Annuler sa propre demande
  annulerMaDemande(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/mes-demandes/${id}/annuler`);
  }

  // 4. Récupérer les demandes en attente pour un Manager
  getPendingForMyTeam(): Observable<DemandeAbsence[]> {
    return this.http.get<DemandeAbsence[]>(`${this.apiUrl}/en-attente/mon-equipe`);
  }

  getAllMyTeam(): Observable<DemandeAbsence[]> {
    return this.http.get<DemandeAbsence[]>(`${this.apiUrl}/demandes-valides/team`);
  }
  // 5. Récupérer toutes les demandes en attente pour un Admin
  getAllPending(): Observable<DemandeAbsence[]> {
    return this.http.get<DemandeAbsence[]>(`${this.apiUrl}/en-attente`);
  }

  // 6. Valider ou Refuser une demande
  updateStatus(id: number, status: StatutDemande): Observable<DemandeAbsence> {
    return this.http.patch<DemandeAbsence>(`${this.apiUrl}/${id}/statut`, { status });
  }

  getAllDemandes(): Observable<DemandeAbsence[]> {
    return this.http.get<DemandeAbsence[]>(`${this.apiUrl}`);
  }
}
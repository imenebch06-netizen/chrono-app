import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface TypeOrganization {
  id: number;
  code: string;
  libelle: string;
}
export interface Manager {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
}

export interface Organization {
  id: number;
  nom: string;
  nom_en?: string | null;
  typeOrganizationId?: number;
  typeOrganization?: TypeOrganization;
  idOrganizationSup?: number;
  organizationSup?: Organization; // Relation vers l'organisation parente
  managerId?: number;
  manager?: Manager; // Informations sur le manager
  fullPath?: string; // Si fourni par le backend ou calculé

  // ➕ Propriétés optionnelles pour la vue en arbre & effectif BDD
  children?: Organization[];
  _count?: { membres: number };
  isExpanded?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private apiUrl = 'http://localhost:3000/api/organizations';

  constructor(private http: HttpClient) {}
  // 🟢 Nouvel endpoint pour récupérer l'arbre complet depuis NestJS
  getOrganizationTree(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.apiUrl}/org-tree`);
  }
  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.apiUrl);
  }
  getTypeOrganizations(): Observable<TypeOrganization[]> {
    return this.http.get<TypeOrganization[]>(`${this.apiUrl}/org-types`);
  }
  getOrganizationById(id: number): Observable<Organization> {
    return this.http.get<Organization>(`${this.apiUrl}/${id}`);
  }

  createOrganization(dto: any): Observable<Organization> {
    return this.http.post<Organization>(this.apiUrl, dto);
  }

  updateOrganization(id: number, dto: any): Observable<Organization> {
    return this.http.patch<Organization>(`${this.apiUrl}/${id}`, dto);
  }

  deleteOrganization(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  assignManager(id: number, managerId: number | null): Observable<Organization> {
    const payload = { 
    managerId: managerId !== null ? Number(managerId) : null 
  };
    return this.http.patch<Organization>(`${this.apiUrl}/${id}/manager`, payload);
  }
}
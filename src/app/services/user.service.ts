import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export enum Role {
  ADMIN = 'ADMIN',
  EMPLOYE = 'EMPLOYE'
}
// If you have an Organization interface, import/define it:
export interface Organization {
  id?: number;
  nom?: string;
  path?: string;
}

export interface Employe {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  password?: string;
  adress?: string | null;
  role: Role;
  organizationId?: number | null;
  organization?: Organization | null;
  organizationGeree?: Organization | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type User = Employe;

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  // 🟢 URL exacte de ton Swagger pour les employés
  private apiUrl = 'http://localhost:3000/api/employe/dashboard';

  // 1️⃣ GET /api/employe/dashboard (Lister TOUS les employés)
  getUsers(): Observable<Employe[]> {
    return this.http.get<Employe[]>(this.apiUrl);
  }

  // 2️⃣ GET /api/employe/dashboard/{id} (Détails d'un employé)
  getUserById(id: number): Observable<Employe> {
    return this.http.get<Employe>(`${this.apiUrl}/${id}`);
  }

  // 3️⃣ POST /api/employe/dashboard (Créer un employé)
  createUser(user: Partial<Employe>): Observable<Employe> {
    return this.http.post<Employe>(this.apiUrl, user);
  }

  // 4️⃣ PATCH /api/employe/dashboard/{id} (Modifier un employé)
  updateUser(id: number, user: Partial<Employe>): Observable<Employe> {
    return this.http.patch<Employe>(`${this.apiUrl}/${id}`, user);
  }

  // 5️⃣ DELETE /api/employe/dashboard/{id} (Supprimer un employé)
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // 6️⃣ GET /api/employe/dashboard/mon-equipe (Espace Manager - Optionnel)
  getMonEquipe(): Observable<Employe[]> {
  // L'intercepteur HTTP envoie le Token JWT, le backend saura exactement quel manager fait la requête !
  return this.http.get<any>(`${this.apiUrl}/mon-equipe`);
  }
}
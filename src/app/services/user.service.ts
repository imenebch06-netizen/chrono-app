import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export enum Role {
  ADMIN = 'ADMIN',
  EMPLOYE = 'EMPLOYE'
}

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
  adress_en?: string | null;
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

  
  private apiUrl = 'http://localhost:3000/api/employe/dashboard';

  
  getUsers(): Observable<Employe[]> {
    return this.http.get<Employe[]>(this.apiUrl);
  }

  
  getUserById(id: number): Observable<Employe> {
    return this.http.get<Employe>(`${this.apiUrl}/${id}`);
  }

  
  createUser(user: Partial<Employe>): Observable<Employe> {
    return this.http.post<Employe>(this.apiUrl, user);
  }

  
  updateUser(id: number, user: Partial<Employe>): Observable<Employe> {
    return this.http.patch<Employe>(`${this.apiUrl}/${id}`, user);
  }

  
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  
  getMonEquipe(): Observable<Employe[]> {
  
  return this.http.get<any>(`${this.apiUrl}/mon-equipe`);
  }
}
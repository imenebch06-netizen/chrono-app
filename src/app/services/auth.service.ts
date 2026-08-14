import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { Employe } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  [x: string]: any;
  private http = inject(HttpClient);
  private router = inject(Router);

  // 🟢 Endpoints backend NestJS
  private authUrl = 'http://localhost:3000/api/auth';
  private profileUrl = 'http://localhost:3000/api/employe/dashboard/me';
  private tokenKey = 'access_token';
  private userKey = 'current_user';

  private currentUserSubject = new BehaviorSubject<any>(this.getUser());
  public currentUser$ = this.currentUserSubject.asObservable();
  // -------------------------------------------------------------
  // 🔑 1. AUTHENTIFICATION (POST /api/auth/login)
  // -------------------------------------------------------------
login(credentials: { email: string; password: string }): Observable<any> {
    return this.http
      .post<{ access_token: string; user: any }>(`${this.authUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          // 1. Sauvegarde du token avec TA méthode
          if (response.access_token) {
            this.saveToken(response.access_token);
          }

          // 2. Sauvegarde de l'utilisateur avec la NOUVELLE méthode
          if (response.user) {
            this.saveUser(response.user);
          }
        })
      );
  }

  // -------------------------------------------------------------
  // 🛠️ 2. GESTION DU TOKEN (Guard & Interceptor)
  // -------------------------------------------------------------
  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // 🟢 Utilisé par l'interceptor pour attacher le header Authorization
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // 🟢 Utilisé par le Guard pour vérifier si l'utilisateur est connecté
  hasToken(): boolean {
    return !!this.getToken();
  }

  saveUser(user: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user); // 📢 Informe instantanément le Header
  }

  getUser(): any {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }



  // Déconnexion
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/authentication/login']);
  }

  // -------------------------------------------------------------
  // 👤 3. ESPACE PERSONNEL EMPLOYÉ (/api/employe/dashboard/me)
  // -------------------------------------------------------------
 getProfile(): Observable<any> {
  return this.http.get<any>(`${this.authUrl}/profile`).pipe(
    map(res => res.user) // 👈 Si 'res.user' n'existe pas dans le JSON, 'getProfile()' renvoie 'undefined' !
  );
}


  updateMyProfile(data: Partial<Employe>): Observable<Employe> {
    return this.http.patch<Employe>(this.profileUrl, data);
  }
  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      // Décode la partie "payload" du Token JWT
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64);
      const decoded = JSON.parse(decodedJson);
      
      // NestJS met souvent le rôle dans "role" ou "roles"
      return decoded.role || (decoded.roles ? decoded.roles[0] : null);
    } catch (e) {
      console.error('Erreur de décodage du token', e);
      return null;
    }
  }
}
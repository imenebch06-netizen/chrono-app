import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { Employe } from './user.service';
import emailjs from '@emailjs/browser';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  [x: string]: any;
  private http = inject(HttpClient);
  private router = inject(Router);


  private authUrl = 'http://localhost:3000/api/auth';
  private profileUrl = 'http://localhost:3000/api/employe/dashboard/me';
  private tokenKey = 'access_token';
  private userKey = 'current_user';

  private currentUserSubject = new BehaviorSubject<any>(this.getUser());
  public currentUser$ = this.currentUserSubject.asObservable();

login(credentials: { email: string; password: string }): Observable<any> {
    return this.http
      .post<{ access_token: string; user: any }>(`${this.authUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          
          if (response.access_token) {
            this.saveToken(response.access_token);
          }

          
          if (response.user) {
            this.saveUser(response.user);
          }
        })
      );
  }

  forgotPassword(email: string): Observable<{ resetToken: string }> {
    return this.http.post<{ resetToken: string }>(`${this.authUrl}/forgot-password`, { email });
  }

  resetPassword(data: { token: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.authUrl}/reset-password`, data);
  }

 
verifyResetToken(token: string): Observable<any> {
  return this.http.get(`${this.authUrl}/verify-reset-token?token=${token}`);
}

 
  async sendResetEmail(userEmail: string, resetLink: string, userName: string = 'Utilisateur'): Promise<any> {
    const serviceID = 'service_9ixfkww';  
    const templateID = 'template_h87s9u7';  
    const publicKey = 'DKM_bo0uNmtHw2a-n';  

    const templateParams = {
      to_email: userEmail,
      to_name: userName,
      reset_link: resetLink,
    };

    return emailjs.send(serviceID, templateID, templateParams, publicKey);
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  
  hasToken(): boolean {
    return !!this.getToken();
  }

  saveUser(user: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user); 
  }

  getUser(): any {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }



  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/authentication/login']);
  }


 getProfile(): Observable<any> {
    return this.http.get<Employe>(this.profileUrl);
}


  updateMyProfile(data: Partial<Employe>): Observable<Employe> {
    return this.http.patch<Employe>(this.profileUrl, data);
  }
  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
    
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64);
      const decoded = JSON.parse(decodedJson);
      

      return decoded.role || (decoded.roles ? decoded.roles[0] : null);
    } catch (e) {
      console.error('Erreur de décodage du token', e);
      return null;
    }
  }
}
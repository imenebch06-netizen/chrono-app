import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PlanningItem {
  id?: number;
  employeId: number;
  dateDebut: string;
  dateFin: string;
  type_travail: string; 
  heureDebut?: string;
  heureFin?: string;
  typeShift?: string;
  plageFixeDebut?: string;
  plageFixeFin?: string;
  joursRepos?: string | number[];
}

export interface CreatePlanningDto {
  planning: PlanningItem[];
}

@Injectable({
  providedIn: 'root',
})
export class PlanningService {
  private apiUrl = 'http://localhost:3000/api/planning'; 
  constructor(private http: HttpClient) {}
  
  getGlobalPlanning(startDate?: string, endDate?: string): Observable<PlanningItem[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<PlanningItem[]>(`${this.apiUrl}/global`, { params });
  }

  
  getMonPlanning(startDate?: string, endDate?: string): Observable<PlanningItem[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<PlanningItem[]>(`${this.apiUrl}/mon-planning`, { params });
  }

  
  getMonEquipePlanning(startDate?: string, endDate?: string): Observable<any[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<any[]>(`${this.apiUrl}/mon-equipe`, { params });
  }

 
  assignPlanning(dto: CreatePlanningDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  
  deletePlanning(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
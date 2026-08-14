import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { PlanningService, PlanningItem } from '../../services/planning.service'; // Ajuste le chemin

export interface UserPlanningDisplay {
  heurDebut: string;
  heurFin: string;
  typeDeTravail: string;
  joursDeRepos: string;
}

@Component({
  selector: 'app-mon-planning',
  standalone: true,
  imports: [CommonModule, MatCardModule, TablerIconsModule],
  templateUrl: './mon-planning.component.html',
})
export class MonPlanningComponent implements OnInit {
  planningDisplay: UserPlanningDisplay | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(private planningService: PlanningService) {}

  ngOnInit(): void {
    this.loadMonPlanning();
  }

  loadMonPlanning(): void {
    this.isLoading = true;
    this.planningService.getMonPlanning().subscribe({
      next: (plannings: PlanningItem[]) => {
        this.isLoading = false;
        if (plannings && plannings.length > 0) {
          // Prendre le dernier planning attribué
          const currentPlanning = plannings[plannings.length - 1];
          this.planningDisplay = this.mapToDisplayFormat(currentPlanning);
        } else {
          this.planningDisplay = null; // Aucun planning attribué
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Impossible de charger le planning.';
        console.error('Erreur chargement planning:', err);
      },
    });
  }

  // Helper pour formater les données brutes de la BDD vers l'affichage
  private mapToDisplayFormat(item: PlanningItem): UserPlanningDisplay {
    return {
      heurDebut: item.heureDebut || '08:00',
      heurFin: item.heureFin || '16:30',
      typeDeTravail: item.type_travail || 'NORMAL',
      joursDeRepos: this.formatJoursRepos(item.joursRepos),
    };
  }

  // Convertit [5, 6] ou "[5, 6]" en "Vendredi, Samedi"
  private formatJoursRepos(jours: any): string {
    if (!jours) return 'Aucun';

    let daysArray: number[] = [];
    if (typeof jours === 'string') {
      try {
        daysArray = JSON.parse(jours);
      } catch {
        return jours; // Retourne la string brute si ce n'est pas un JSON
      }
    } else if (Array.isArray(jours)) {
      daysArray = jours;
    }

    const dayNames: { [key: number]: string } = {
      1: 'Lundi',
      2: 'Mardi',
      3: 'Mercredi',
      4: 'Jeudi',
      5: 'Vendredi',
      6: 'Samedi',
      0: 'Dimanche',
      7: 'Dimanche',
    };

    return daysArray.map((day) => dayNames[day] || day).join(', ');
  }
}
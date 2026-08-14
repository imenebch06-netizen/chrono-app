import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { 
  NgApexchartsModule, 
  ApexChart, 
  ApexAxisChartSeries, 
  ApexXAxis, 
  ApexYAxis, 
  ApexPlotOptions, 
  ApexTooltip, 
  ApexDataLabels 
} from 'ng-apexcharts';
import { StatistiquesService } from '../../services/statistiques.service';
import { TeamStats } from '../../models/statistiques.model';

@Component({
  selector: 'app-team-stats',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, NgApexchartsModule],
  template: `
    <div class="stats-container">
      @if (teamStats(); as t) {
        <!-- En-tête -->
        <div class="header">
          <h1>Statistiques de l'Équipe</h1>
          <p class="subtitle">Supervision en temps réel • <strong>{{ t.organizationNom }}</strong></p>
        </div>

        <!-- Grille de Cartes KPI -->
        <div class="kpi-grid">
          <!-- Total Membres -->
          <mat-card class="kpi-card border-indigo">
            <div class="kpi-content">
              <span class="kpi-label">Total Membres</span>
              <span class="kpi-value">{{ t.totalSubordonnes }}</span>
            </div>
            <div class="kpi-icon bg-indigo">
              <mat-icon>groups</mat-icon>
            </div>
          </mat-card>

          <!-- Présents -->
          <mat-card class="kpi-card border-emerald">
            <div class="kpi-content">
              <span class="kpi-label">Présents Aujourd'hui</span>
              <span class="kpi-value text-emerald">{{ t.presentsAujourdhui }}</span>
            </div>
            <div class="kpi-icon bg-emerald">
              <mat-icon>how_to_reg</mat-icon>
            </div>
          </mat-card>

          <!-- Absents -->
          <mat-card class="kpi-card border-amber">
            <div class="kpi-content">
              <span class="kpi-label">Absents / Congés</span>
              <span class="kpi-value text-amber">{{ t.enCongeAujourdhui }}</span>
            </div>
            <div class="kpi-icon bg-amber">
              <mat-icon>event_busy</mat-icon>
            </div>
          </mat-card>

          <!-- Demandes -->
          <mat-card class="kpi-card border-rose">
            <div class="kpi-content">
              <span class="kpi-label">Demandes à Valider</span>
              <span class="kpi-value text-rose">{{ t.demandesEnAttenteValidation }}</span>
            </div>
            <div class="kpi-icon bg-rose">
              <mat-icon>rule</mat-icon>
            </div>
          </mat-card>
        </div>

        <!-- Graphique -->
        <mat-card class="chart-card">
          <div class="chart-header">
            <mat-icon class="icon-amber">bar_chart</mat-icon>
            <h2>Répartition des Absences dans l'Équipe</h2>
          </div>
          <div class="chart-wrapper">
            <apx-chart
              [series]="typeAbsenceSeries"
              [chart]="typeAbsenceChart"
              [xaxis]="typeAbsenceXAxis"
              [yaxis]="typeAbsenceYAxis"
              [colors]="['#F59E0B']"
              [plotOptions]="typeAbsencePlotOptions"
              [dataLabels]="chartDataLabels"
              [tooltip]="chartTooltip">
            </apx-chart>
          </div>
        </mat-card>
      } @else {
        <div class="loading-state">
          <p>Chargement des statistiques d'équipe...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .stats-container {
      padding: 24px;
      background-color: #f8fafc;
      min-height: 100vh;
      font-family: Roboto, "Helvetica Neue", sans-serif;
    }
    .header h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
    }
    .subtitle {
      color: #64748b;
      font-size: 0.875rem;
      margin-top: 4px;
      margin-bottom: 24px;
    }
    
    /* Grille KPI */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .kpi-card {
      padding: 20px !important;
      border-radius: 16px !important;
      display: flex !important;
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: center !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
      background: #ffffff !important;
      border-bottom: 4px solid #cbd5e1;
    }
    
    /* Bordures de couleur */
    .border-indigo { border-bottom-color: #6366f1; }
    .border-emerald { border-bottom-color: #10b981; }
    .border-amber { border-bottom-color: #f59e0b; }
    .border-rose { border-bottom-color: #f43f5e; }

    .kpi-content {
      display: flex;
      flex-direction: column;
    }
    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #94a3b8;
      letter-spacing: 0.05em;
    }
    .kpi-value {
      font-size: 1.875rem;
      font-weight: 900;
      color: #1e293b;
      margin-top: 4px;
    }
    .text-emerald { color: #10b981; }
    .text-amber { color: #f59e0b; }
    .text-rose { color: #f43f5e; }

    /* Icônes */
    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bg-indigo { background-color: #e0e7ff; color: #4f46e5; }
    .bg-emerald { background-color: #d1fae5; color: #059669; }
    .bg-amber { background-color: #fef3c7; color: #d97706; }
    .bg-rose { background-color: #ffe4e6; color: #e11d48; }

    /* Graphique Card */
    .chart-card {
      padding: 24px !important;
      border-radius: 16px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
      background: #ffffff !important;
    }
    .chart-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
    }
    .chart-header h2 {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .icon-amber { color: #f59e0b; }
    .chart-wrapper {
      width: 100%;
      min-height: 320px;
    }
    .loading-state {
      padding: 48px;
      text-align: center;
      color: #94a3b8;
    }
  `]
})
export class TeamStatsComponent implements OnInit {
  private statsService = inject(StatistiquesService);
  teamStats = signal<TeamStats | null>(null);

  typeAbsenceSeries: ApexAxisChartSeries = [];
  typeAbsenceChart: ApexChart = { type: 'bar', height: 320, toolbar: { show: false } };
  typeAbsenceXAxis: ApexXAxis = { categories: [], labels: { style: { colors: '#64748B' } } };
  typeAbsenceYAxis: ApexYAxis = { labels: { style: { colors: '#64748B' } } };
  typeAbsencePlotOptions: ApexPlotOptions = {
    bar: { horizontal: false, columnWidth: '40%', borderRadius: 8, distributed: true }
  };
  chartDataLabels: ApexDataLabels = { enabled: true };
  chartTooltip: ApexTooltip = { theme: 'light' };

  ngOnInit(): void {
    this.statsService.getTeamStats().subscribe((data) => {
      this.teamStats.set(data);
      this.typeAbsenceSeries = [{ name: 'Nombre d\'absences', data: data.absencesParType.series }];
      this.typeAbsenceXAxis = { ...this.typeAbsenceXAxis, categories: data.absencesParType.labels };
    });
  }
}
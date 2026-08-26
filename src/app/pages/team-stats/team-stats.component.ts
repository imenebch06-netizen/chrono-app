import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, MatIconModule, NgApexchartsModule],
  template: `
    <div class="p-6 space-y-8 bg-[var(--mat-sys-surface-bright)] min-h-screen">
      @if (teamStats(); as t) {
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-extrabold text-[var(--mat-sys-on-background)] tracking-tight">Statistiques de l'Équipe</h1>
            <p class="text-[var(--mat-sys-on-background)]/60 text-sm mt-1">Supervision en temps réel • <strong>{{ t.organizationNom }}</strong></p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div class="bg-[var(--mat-sys-surface)] p-4 rounded-xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--mat-sys-on-background)]/50">Total Membres</span>
              <h3 class="text-2xl font-bold text-[var(--mat-sys-on-background)]">{{ t.totalSubordonnes }}</h3>
            </div>
            <div class="p-2.5 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-lg group-hover:scale-105 transition">
              <mat-icon>groups</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-4 rounded-xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--mat-sys-on-background)]/50">Présents Aujourd'hui</span>
              <h3 class="text-2xl font-bold text-[var(--mat-sys-primary)]">{{ t.presentsAujourdhui }}</h3>
            </div>
            <div class="p-2.5 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-lg group-hover:scale-105 transition">
              <mat-icon>how_to_reg</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-4 rounded-xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--mat-sys-on-background)]/50">Absents / Congés</span>
              <h3 class="text-2xl font-bold text-[var(--mat-sys-on-background)]">{{ t.enCongeAujourdhui }}</h3>
            </div>
            <div class="p-2.5 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-lg group-hover:scale-105 transition">
              <mat-icon>event_busy</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-4 rounded-xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--mat-sys-on-background)]/50">Demandes à Valider</span>
              <h3 class="text-2xl font-bold text-[var(--mat-sys-on-background)]">{{ t.demandesEnAttenteValidation }}</h3>
            </div>
            <div class="p-2.5 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-lg group-hover:scale-105 transition">
              <mat-icon>rule</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>
        </div>

        <div class="bg-[var(--mat-sys-surface)] p-6 rounded-xl shadow-sm border border-[var(--mat-sys-outline)]">
          <h2 class="text-lg font-bold text-[var(--mat-sys-on-background)] mb-6 flex items-center gap-2">
            <mat-icon class="text-[var(--mat-sys-primary)]">bar_chart</mat-icon>
            Répartition des Absences dans l'Équipe
          </h2>
          <div class="w-full min-h-[320px]">
            <apx-chart
              [series]="typeAbsenceSeries"
              [chart]="typeAbsenceChart"
              [xaxis]="typeAbsenceXAxis"
              [yaxis]="typeAbsenceYAxis"
              [colors]="chartColors"
              [plotOptions]="typeAbsencePlotOptions"
              [dataLabels]="chartDataLabels"
              [tooltip]="chartTooltip">
            </apx-chart>
          </div>
        </div>
      } @else {
        <div class="flex items-center justify-center p-12 bg-[var(--mat-sys-surface)] rounded-xl border border-[var(--mat-sys-outline)]">
          <p class="text-[var(--mat-sys-on-background)]/40 font-medium animate-pulse">Chargement des statistiques d'équipe...</p>
        </div>
      }
    </div>
  `,
})
export class TeamStatsComponent implements OnInit {
  private statsService = inject(StatistiquesService);
  teamStats = signal<TeamStats | null>(null);

  chartColors = ['#6A62FD', '#8F88FF', '#B5B0FF', '#DAD7FF', '#EDEBFF'];

  typeAbsenceSeries: ApexAxisChartSeries = [];
  typeAbsenceChart: ApexChart = { type: 'bar', height: 320, toolbar: { show: false } };
  typeAbsenceXAxis: ApexXAxis = { categories: [], labels: { style: { colors: '#526b7a' } } };
  typeAbsenceYAxis: ApexYAxis = { labels: { style: { colors: '#526b7a' } } };
  typeAbsencePlotOptions: ApexPlotOptions = {
    bar: { horizontal: false, columnWidth: '40%', borderRadius: 8, distributed: true }
  };
  chartDataLabels: ApexDataLabels = { enabled: true };
  chartTooltip: ApexTooltip = { theme: 'light' };

  ngOnInit(): void {
    this.statsService.getTeamStats().subscribe((data) => {
      this.teamStats.set(data);
      
      this.typeAbsenceSeries = [
        { 
          name: 'Nombre d\'absences', 
          data: [...data.absencesParType.series] 
        }
      ];
      this.typeAbsenceXAxis = { 
        ...this.typeAbsenceXAxis, 
        categories: [...data.absencesParType.labels] 
      };
    });
  }
}
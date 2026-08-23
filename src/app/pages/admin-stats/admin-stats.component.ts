import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { 
  NgApexchartsModule, 
  ApexChart, 
  ApexNonAxisChartSeries, 
  ApexPlotOptions, 
  ApexLegend, 
  ApexDataLabels,
  ApexTooltip,
} from 'ng-apexcharts';
import { StatistiquesService } from '../../services/statistiques.service';
import { AdminGlobalStats } from '../../models/statistiques.model';
@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, NgApexchartsModule],
  template:` <div class="p-6 space-y-8 bg-[var(--mat-sys-surface-bright)] min-h-screen">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-[var(--mat-sys-on-background)] tracking-tight">Vue d'Ensemble Entreprise</h1>
          <p class="text-[var(--mat-sys-on-background)]/60 text-sm mt-1">Supervision globale et indicateurs administratifs</p>
        </div>
      </div>

      @if (adminStats(); as a) {
        <!-- Grille KPI (Style harmonisé) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <!-- Total Employés -->
          <div class="bg-[var(--mat-sys-surface)] p-4 rounded-xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--mat-sys-on-background)]/50">Total Employés</span>
              <h3 class="text-2xl font-bold text-[var(--mat-sys-on-background)]">{{ a.totalEmployes }}</h3>
            </div>
            <div class="p-2.5 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-lg group-hover:scale-105 transition">
              <mat-icon>people</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <!-- Organisations -->
          <div class="bg-[var(--mat-sys-surface)] p-4 rounded-xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--mat-sys-on-background)]/50">Organisations</span>
              <h3 class="text-2xl font-bold text-[var(--mat-sys-on-background)]">{{ a.totalOrganizations }}</h3>
            </div>
            <div class="p-2.5 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-lg group-hover:scale-105 transition">
              <mat-icon>corporate_fare</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <!-- Taux de Présence Global -->
          <div class="bg-[var(--mat-sys-surface)] p-4 rounded-xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--mat-sys-on-background)]/50">Présence Globale</span>
              <h3 class="text-2xl font-bold text-[var(--mat-sys-primary)]">{{ a.tauxPresenceGlobal }}%</h3>
            </div>
            <div class="p-2.5 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-lg group-hover:scale-105 transition">
              <mat-icon>trending_up</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <!-- Demandes en Attente -->
          <div class="bg-[var(--mat-sys-surface)] p-4 rounded-xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--mat-sys-on-background)]/50">Demandes en Attente</span>
              <h3 class="text-2xl font-bold text-[var(--mat-sys-on-background)]">{{ a.demandesEnAttenteTotales }}</h3>
            </div>
            <div class="p-2.5 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-lg group-hover:scale-105 transition">
              <mat-icon>pending_actions</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

        </div>

        <!-- Graphique Global -->
        <div class="bg-[var(--mat-sys-surface)] p-6 rounded-xl shadow-sm border border-[var(--mat-sys-outline)] max-w-3xl mx-auto">
          <h2 class="text-lg font-bold text-[var(--mat-sys-on-background)] mb-6 flex items-center gap-2">
            <mat-icon class="text-[var(--mat-sys-primary)]">donut_large</mat-icon>
            Répartition globale des demandes d'absence
          </h2>
          <div class="w-full flex justify-center min-h-[350px]">
            <apx-chart
              [series]="donutSeries"
              [chart]="donutChart"
              [labels]="a.repartitionDemandesGlobales.labels"
              [colors]="chartColors"
              [plotOptions]="donutPlotOptions"
              [legend]="chartLegend"
              [dataLabels]="chartDataLabels"
              [tooltip]="chartTooltip">
            </apx-chart>
          </div>
        </div>
      } @else {
        <div class="flex items-center justify-center p-12 bg-[var(--mat-sys-surface)] rounded-xl border border-[var(--mat-sys-outline)]">
          <p class="text-[var(--mat-sys-on-background)]/40 font-medium animate-pulse">Chargement des données de l'entreprise...</p>
        </div>
      }
    </div>
    `,
})
export class AdminStatsComponent implements OnInit {
  private statsService = inject(StatistiquesService);
  adminStats = signal<AdminGlobalStats | null>(null);

  // Dégradé monochrome basé sur la couleur primaire de la charte
  chartColors = ['#6A62FD', '#8F88FF', '#C7C3FF'];

  donutSeries: ApexNonAxisChartSeries = [];
  donutChart: ApexChart = { type: 'donut', height: 350, animations: { enabled: true } };
  donutPlotOptions: ApexPlotOptions = {
    pie: { 
      donut: { 
        size: '68%', 
        labels: { 
          show: true, 
          total: { show: true, label: 'Total Demandes', color: '#526b7a' } 
        } 
      } 
    }
  };
  chartLegend: ApexLegend = { position: 'bottom', fontSize: '14px' };
  chartDataLabels: ApexDataLabels = { enabled: true };
  chartTooltip: ApexTooltip = { theme: 'light' };

  ngOnInit(): void {
    this.statsService.getAdminStats().subscribe((data) => {
      this.adminStats.set(data);
      this.donutSeries = data.repartitionDemandesGlobales.series;
    });
  }
}
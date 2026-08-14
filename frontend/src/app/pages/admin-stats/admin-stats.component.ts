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
  template:` <div class="p-6 space-y-8 bg-slate-50/50 min-h-screen">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Vue d'Ensemble Entreprise</h1>
          <p class="text-slate-500 text-sm mt-1">Supervision globale et indicateurs administratifs</p>
        </div>
      </div>

      @if (adminStats(); as a) {
        <!-- Grille KPI (Style harmonisé) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <!-- Total Employés -->
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Employés</span>
              <h3 class="text-3xl font-black text-slate-800">{{ a.totalEmployes }}</h3>
            </div>
            <div class="p-3 bg-slate-100 text-slate-700 rounded-xl group-hover:scale-110 transition">
              <mat-icon>people</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-slate-700"></div>
          </div>

          <!-- Organisations -->
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Organisations</span>
              <h3 class="text-3xl font-black text-slate-800">{{ a.totalOrganizations }}</h3>
            </div>
            <div class="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition">
              <mat-icon>corporate_fare</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
          </div>

          <!-- Taux de Présence Global -->
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Présence Globale</span>
              <h3 class="text-3xl font-black text-emerald-600">{{ a.tauxPresenceGlobal }}%</h3>
            </div>
            <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition">
              <mat-icon>trending_up</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
          </div>

          <!-- Demandes en Attente -->
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Demandes en Attente</span>
              <h3 class="text-3xl font-black text-purple-600">{{ a.demandesEnAttenteTotales }}</h3>
            </div>
            <div class="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition">
              <mat-icon>pending_actions</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
          </div>

        </div>

        <!-- Graphique Global -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-3xl mx-auto">
          <h2 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <mat-icon class="text-blue-600">donut_large</mat-icon>
            Répartition globale des demandes d'absence
          </h2>
          <div class="w-full flex justify-center min-h-[350px]">
            <apx-chart
              [series]="donutSeries"
              [chart]="donutChart"
              [labels]="a.repartitionDemandesGlobales.labels"
              [colors]="['#3B82F6', '#8B5CF6', '#EF4444']"
              [plotOptions]="donutPlotOptions"
              [legend]="chartLegend"
              [dataLabels]="chartDataLabels"
              [tooltip]="chartTooltip">
            </apx-chart>
          </div>
        </div>
      } @else {
        <div class="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100">
          <p class="text-slate-400 font-medium animate-pulse">Chargement des données de l'entreprise...</p>
        </div>
      }
    </div>
    `,
})
export class AdminStatsComponent implements OnInit {
  private statsService = inject(StatistiquesService);
  adminStats = signal<AdminGlobalStats | null>(null);

  donutSeries: ApexNonAxisChartSeries = [];
  donutChart: ApexChart = { type: 'donut', height: 350, animations: { enabled: true } };
  donutPlotOptions: ApexPlotOptions = {
    pie: { 
      donut: { 
        size: '68%', 
        labels: { 
          show: true, 
          total: { show: true, label: 'Total Demandes', color: '#64748B' } 
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
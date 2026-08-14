import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { 
  NgApexchartsModule, 
  ApexChart, 
  ApexNonAxisChartSeries, 
  ApexAxisChartSeries, 
  ApexXAxis, 
  ApexPlotOptions, 
  ApexLegend, 
  ApexDataLabels, 
  ApexTooltip, 
  ApexStroke,
  ApexYAxis
} from 'ng-apexcharts';
import { StatistiquesService } from '../../services/statistiques.service';
import { PersonalStats } from '../../models/statistiques.model';

@Component({
  selector: 'app-personal-stats',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, NgApexchartsModule],
  template: `
    <div class="p-6 space-y-8 bg-slate-50/50 min-h-screen">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Espace Personnel</h1>
          <p class="text-slate-500 text-sm mt-1">Consultez vos soldes, vos heures et votre suivi d'activité</p>
        </div>
      </div>

      @if (stats(); as s) {
        <!-- Cartes KPI -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Solde Congés -->
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Solde Congés</span>
              <h3 class="text-3xl font-black text-slate-800">{{ s.soldeConges }} <span class="text-sm font-normal text-slate-500">jours</span></h3>
            </div>
            <div class="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition">
              <mat-icon>beach_access</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
          </div>

          <!-- Solde RTT -->
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Solde RTT</span>
              <h3 class="text-3xl font-black text-slate-800">{{ s.soldeRtt }} <span class="text-sm font-normal text-slate-500">jours</span></h3>
            </div>
            <div class="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition">
              <mat-icon>event_repeat</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
          </div>

          <!-- Crédit / Débit -->
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Crédit / Débit</span>
              <h3 class="text-3xl font-black" [ngClass]="s.creditDebitHeures >= 0 ? 'text-emerald-600' : 'text-rose-500'">
                {{ s.creditDebitHeures >= 0 ? '+' : '' }}{{ s.creditDebitHeures }}h
              </h3>
            </div>
            <div class="p-3 rounded-xl group-hover:scale-110 transition" [ngClass]="s.creditDebitHeures >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'">
              <mat-icon>schedule</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1" [ngClass]="s.creditDebitHeures >= 0 ? 'bg-emerald-500' : 'bg-rose-500'"></div>
          </div>

          <!-- Taux de présence -->
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Taux de Présence</span>
              <h3 class="text-3xl font-black text-slate-800">{{ s.tauxPresence }}%</h3>
            </div>
            <div class="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition">
              <mat-icon>verified</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
          </div>
        </div>

        <!-- Graphiques -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <mat-icon class="text-blue-500">pie_chart</mat-icon>
              Répartition des Absences
            </h2>
            <div class="w-full flex justify-center min-h-[320px]">
              <apx-chart
                [series]="donutSeries"
                [chart]="donutChart"
                [labels]="donutLabels"
                [colors]="['#3B82F6', '#EF4444', '#10B981']"
                [plotOptions]="donutPlotOptions"
                [legend]="chartLegend"
                [dataLabels]="chartDataLabels">
              </apx-chart>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <mat-icon class="text-indigo-500">bar_chart</mat-icon>
              Suivi d'Activité
            </h2>
            <div class="w-full min-h-[320px]">
              <apx-chart
                [series]="barSeries"
                [chart]="barChart"
                [xaxis]="barXAxis"
                [yaxis]="barYAxis"
                [colors]="['#6366F1', '#10B981']"
                [plotOptions]="barPlotOptions"
                [stroke]="barStroke"
                [tooltip]="chartTooltip"
                [legend]="chartLegend">
              </apx-chart>
            </div>
          </div>
        </div>
      } @else {
        <div class="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100">
          <p class="text-slate-400 font-medium animate-pulse">Chargement de vos données...</p>
        </div>
      }
    </div>
  `,
})
export class PersonalStatsComponent implements OnInit {
  private statsService = inject(StatistiquesService);
  stats = signal<PersonalStats | null>(null);

  // Configuration Donut Chart
  donutSeries: ApexNonAxisChartSeries = [];
  donutLabels = ['Congés', 'Absences', 'Récupérations'];
  donutChart: ApexChart = { type: 'donut', height: 320, animations: { enabled: true } };
  donutPlotOptions: ApexPlotOptions = {
    pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Total' } } } }
  };

  // Configuration Bar Chart
  barSeries: ApexAxisChartSeries = [];
  barXAxis: ApexXAxis = { categories: [], labels: { style: { colors: '#64748B' } } };
  barYAxis: ApexYAxis = { labels: { style: { colors: '#64748B' } } };
  barChart: ApexChart = { type: 'bar', height: 320, toolbar: { show: false } };
  barPlotOptions: ApexPlotOptions = {
    bar: { horizontal: false, columnWidth: '45%', borderRadius: 6 }
  };
  barStroke: ApexStroke = { show: true, width: 2, colors: ['transparent'] };

  // Options communes
  chartLegend: ApexLegend = { position: 'bottom', fontSize: '14px' };
  chartDataLabels: ApexDataLabels = { enabled: true };
  chartTooltip: ApexTooltip = { theme: 'light' };

  ngOnInit(): void {
    this.statsService.getPersonalStats().subscribe((data) => {
      this.stats.set(data);

      this.donutSeries = [
        data.repartitionAbsences.conges,
        data.repartitionAbsences.absences,
        data.repartitionAbsences.recuperations,
      ];

      this.barSeries = [
        { name: 'Heures Travaillées', data: data.evolutionHeuresMensuel.heuresTravaillees },
        { name: 'Crédit/Débit (h)', data: data.evolutionHeuresMensuel.creditDebit },
      ];
      this.barXAxis = { ...this.barXAxis, categories: data.evolutionHeuresMensuel.mois };
    });
  }
}
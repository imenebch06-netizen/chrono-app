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
    <div class="p-6 space-y-8 bg-[var(--mat-sys-surface-bright)] min-h-screen">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-[var(--mat-sys-on-background)] tracking-tight">Espace Personnel</h1>
          <p class="text-[var(--mat-sys-on-background)]/60 text-sm mt-1">Consultez vos soldes, vos heures et votre suivi d'activité</p>
        </div>
      </div>

      @if (stats(); as s) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div class="bg-[var(--mat-sys-surface)] p-4 rounded-xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--mat-sys-on-background)]/50">Solde Congés</span>
              <h3 class="text-2xl font-bold text-[var(--mat-sys-on-background)]">{{ s.soldeConges }} <span class="text-sm font-normal text-[var(--mat-sys-on-background)]/50">jours</span></h3>
            </div>
            <div class="p-2.5 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-lg group-hover:scale-105 transition">
              <mat-icon>beach_access</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-4 rounded-xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--mat-sys-on-background)]/50">Solde RTT</span>
              <h3 class="text-2xl font-bold text-[var(--mat-sys-on-background)]">{{ s.soldeRtt }} <span class="text-sm font-normal text-[var(--mat-sys-on-background)]/50">jours</span></h3>
            </div>
            <div class="p-2.5 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-lg group-hover:scale-105 transition">
              <mat-icon>event_repeat</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-4 rounded-xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--mat-sys-on-background)]/50">Crédit / Débit</span>
              <h3 class="text-2xl font-bold" [ngClass]="s.creditDebitHeures >= 0 ? 'text-[var(--mat-sys-primary)]' : 'text-[#E4585F]'">
                {{ s.creditDebitHeures >= 0 ? '+' : '' }}{{ s.creditDebitHeures }}h
              </h3>
            </div>
            <div class="p-2.5 rounded-lg group-hover:scale-105 transition" [ngClass]="s.creditDebitHeures >= 0 ? 'bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)]' : 'bg-[#FCE8E9] text-[#E4585F]'">
              <mat-icon>schedule</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px]" [ngClass]="s.creditDebitHeures >= 0 ? 'bg-[var(--mat-sys-primary)]' : 'bg-[#E4585F]'"></div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-4 rounded-xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:shadow-md transition">
            <div class="space-y-1 z-10">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--mat-sys-on-background)]/50">Taux de Présence</span>
              <h3 class="text-2xl font-bold text-[var(--mat-sys-on-background)]">{{ s.tauxPresence }}%</h3>
            </div>
            <div class="p-2.5 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-lg group-hover:scale-105 transition">
              <mat-icon>verified</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-[var(--mat-sys-surface)] p-6 rounded-xl shadow-sm border border-[var(--mat-sys-outline)]">
            <h2 class="text-lg font-bold text-[var(--mat-sys-on-background)] mb-6 flex items-center gap-2">
              <mat-icon class="text-[var(--mat-sys-primary)]">pie_chart</mat-icon>
              Répartition des Absences
            </h2>
            <div class="w-full flex justify-center min-h-[320px]">
              <apx-chart
                [series]="donutSeries"
                [chart]="donutChart"
                [labels]="donutLabels"
                [colors]="donutColors"
                [plotOptions]="donutPlotOptions"
                [legend]="chartLegend"
                [dataLabels]="chartDataLabels">
              </apx-chart>
            </div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-6 rounded-xl shadow-sm border border-[var(--mat-sys-outline)]">
            <h2 class="text-lg font-bold text-[var(--mat-sys-on-background)] mb-6 flex items-center gap-2">
              <mat-icon class="text-[var(--mat-sys-primary)]">bar_chart</mat-icon>
              Suivi d'Activité
            </h2>
            <div class="w-full min-h-[320px]">
              <apx-chart
                [series]="barSeries"
                [chart]="barChart"
                [xaxis]="barXAxis"
                [yaxis]="barYAxis"
                [colors]="barColors"
                [plotOptions]="barPlotOptions"
                [stroke]="barStroke"
                [tooltip]="chartTooltip"
                [legend]="chartLegend">
              </apx-chart>
            </div>
          </div>
        </div>
      } @else {
        <div class="flex items-center justify-center p-12 bg-[var(--mat-sys-surface)] rounded-xl border border-[var(--mat-sys-outline)]">
          <p class="text-[var(--mat-sys-on-background)]/40 font-medium animate-pulse">Chargement de vos données...</p>
        </div>
      }
    </div>
  `,
})
export class PersonalStatsComponent implements OnInit {
  private statsService = inject(StatistiquesService);
  stats = signal<PersonalStats | null>(null);

  donutSeries: ApexNonAxisChartSeries = [];
  donutLabels = ['Congés', 'Absences', 'Récupérations'];
  donutColors = ['#6A62FD', '#8F88FF', '#C7C3FF'];
  donutChart: ApexChart = { type: 'donut', height: 320, animations: { enabled: true } };
  donutPlotOptions: ApexPlotOptions = {
    pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Total', color: '#526b7a' } } } }
  };

  barSeries: ApexAxisChartSeries = [];
  barColors = ['#6A62FD', '#526b7a'];
  barXAxis: ApexXAxis = { categories: [], labels: { style: { colors: '#526b7a' } } };
  barYAxis: ApexYAxis = { labels: { style: { colors: '#526b7a' } } };
  barChart: ApexChart = { type: 'bar', height: 320, toolbar: { show: false } };
  barPlotOptions: ApexPlotOptions = {
    bar: { horizontal: false, columnWidth: '45%', borderRadius: 6 }
  };
  barStroke: ApexStroke = { show: true, width: 2, colors: ['transparent'] };

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
        { name: 'Heures Travaillées', data: [...data.evolutionHeuresMensuel.heuresTravaillees] },
        { name: 'Crédit/Débit (h)', data: [...data.evolutionHeuresMensuel.creditDebit] },
      ];
      this.barXAxis = { ...this.barXAxis, categories: [...data.evolutionHeuresMensuel.mois] };
    });
  }
}
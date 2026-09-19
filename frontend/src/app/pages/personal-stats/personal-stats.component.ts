import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
  imports: [CommonModule, MatCardModule, MatIconModule, NgApexchartsModule, TranslateModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 space-y-6">
      <div class="flex items-center justify-between bg-[var(--mat-sys-surface)] p-15 rounded-2xl border border-[var(--mat-sys-outline)] shadow-sm">
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-[var(--mat-sys-on-background)] tracking-tight">
            {{ 'PERSONAL_STATS.TITLE' | translate }}
          </h1>
          <p class="text-[var(--mat-sys-on-background)]/60 text-xs sm:text-sm mt-0.5">
            {{ 'PERSONAL_STATS.SUBTITLE' | translate }}
          </p>
        </div>
      </div>

      @if (stats(); as s) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div class="bg-[var(--mat-sys-surface)] p-10 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:border-[var(--mat-sys-primary)]/40 transition-all">
            <div class="space-y-1 z-10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--mat-sys-on-background)]/40">
                {{ 'PERSONAL_STATS.LEAVE_BALANCE' | translate }}
              </span>
              <h3 class="text-2xl font-black text-[var(--mat-sys-on-background)]">
                {{ s.soldeConges }} <span class="text-xs font-normal text-[var(--mat-sys-on-background)]/50">{{ 'PERSONAL_STATS.DAYS' | translate }}</span>
              </h3>
            </div>
            <div class="p-3 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-xl group-hover:scale-105 transition-transform">
              <mat-icon>beach_access</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-10 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:border-[var(--mat-sys-primary)]/40 transition-all">
            <div class="space-y-1 z-10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--mat-sys-on-background)]/40">
                {{ 'PERSONAL_STATS.RTT_BALANCE' | translate }}
              </span>
              <h3 class="text-2xl font-black text-[var(--mat-sys-on-background)]">
                {{ s.soldeRtt }} <span class="text-xs font-normal text-[var(--mat-sys-on-background)]/50">{{ 'PERSONAL_STATS.HOURS' | translate }}</span>
              </h3>
            </div>
            <div class="p-3 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-xl group-hover:scale-105 transition-transform">
              <mat-icon>event_repeat</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-10 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:border-[var(--mat-sys-primary)]/40 transition-all">
            <div class="space-y-1 z-10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--mat-sys-on-background)]/40">
                {{ 'PERSONAL_STATS.CREDIT_DEBIT' | translate }}
              </span>
              <h3 class="text-2xl font-black" [ngClass]="s.creditDebitHeures >= 0 ? 'text-[var(--mat-sys-primary)]' : 'text-[#E4585F]'">
                {{ s.creditDebitHeures >= 0 ? '+' : '' }}{{ s.creditDebitHeures }}h
              </h3>
            </div>
            <div class="p-3 rounded-xl group-hover:scale-105 transition-transform" [ngClass]="s.creditDebitHeures >= 0 ? 'bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)]' : 'bg-[#FCE8E9] text-[#E4585F]'">
              <mat-icon>schedule</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px]" [ngClass]="s.creditDebitHeures >= 0 ? 'bg-[var(--mat-sys-primary)]' : 'bg-[#E4585F]'"></div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-10 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:border-[var(--mat-sys-primary)]/40 transition-all">
            <div class="space-y-1 z-10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--mat-sys-on-background)]/40">
                {{ 'PERSONAL_STATS.ATTENDANCE_RATE' | translate }}
              </span>
              <h3 class="text-2xl font-black text-[var(--mat-sys-on-background)]">{{ s.tauxPresence }}%</h3>
            </div>
            <div class="p-3 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-xl group-hover:scale-105 transition-transform">
              <mat-icon>verified</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-[var(--mat-sys-surface)] p-15 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)]">
            <h2 class="text-lg font-bold text-[var(--mat-sys-on-background)] mb-6 flex items-center gap-2">
              <mat-icon class="text-[var(--mat-sys-primary)]">pie_chart</mat-icon>
              {{ 'PERSONAL_STATS.ABSENCE_DISTRIBUTION' | translate }}
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

          <div class="bg-[var(--mat-sys-surface)] p-15 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)]">
            <h2 class="text-lg font-bold text-[var(--mat-sys-on-background)] mb-6 flex items-center gap-2">
              <mat-icon class="text-[var(--mat-sys-primary)]">bar_chart</mat-icon>
              {{ 'PERSONAL_STATS.ACTIVITY_TRACKING' | translate }}
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
        <div class="flex items-center justify-center p-16 bg-[var(--mat-sys-surface)] rounded-2xl border border-[var(--mat-sys-outline)]">
          <p class="text-xs text-[var(--mat-sys-on-background)]/40 font-medium animate-pulse">
            {{ 'PERSONAL_STATS.LOADING' | translate }}
          </p>
        </div>
      }
    </div>
  `,
})
export class PersonalStatsComponent implements OnInit {
  private statsService = inject(StatistiquesService);
  private translateService = inject(TranslateService);

  stats = signal<PersonalStats | null>(null);

  donutSeries: ApexNonAxisChartSeries = [];
  donutLabels: string[] = [];
  donutColors = ['#635BFF', '#8F88FF', '#C7C3FF'];
  donutChart: ApexChart = { type: 'donut', height: 320, animations: { enabled: true }, background: 'transparent' };
  donutPlotOptions: ApexPlotOptions = {};

  barSeries: ApexAxisChartSeries = [];
  barColors = ['#635BFF', '#8F88FF'];
  barXAxis: ApexXAxis = { categories: [], labels: { style: { colors: 'var(--mat-sys-on-background)' } } };
  barYAxis: ApexYAxis = { labels: { style: { colors: 'var(--mat-sys-on-background)' } } };
  barChart: ApexChart = { type: 'bar', height: 320, toolbar: { show: false }, background: 'transparent' };
  barPlotOptions: ApexPlotOptions = { bar: { horizontal: false, columnWidth: '45%', borderRadius: 6 } };
  barStroke: ApexStroke = { show: true, width: 2, colors: ['transparent'] };

  chartLegend: ApexLegend = { position: 'bottom', fontSize: '13px', labels: { colors: 'var(--mat-sys-on-background)' } };
  chartDataLabels: ApexDataLabels = { enabled: true };
  chartTooltip: ApexTooltip = { theme: 'dark' };

  ngOnInit(): void {
    this.statsService.getPersonalStats().subscribe((data) => {
      this.stats.set(data);

      this.donutLabels = [
        this.translateService.instant('PERSONAL_STATS.LEAVES'),
        this.translateService.instant('PERSONAL_STATS.ABSENCES'),
        this.translateService.instant('PERSONAL_STATS.RECOVERIES')
      ];

      this.donutPlotOptions = {
        pie: { 
          donut: { 
            size: '70%', 
            labels: { 
              show: true, 
              total: { 
                show: true, 
                label: this.translateService.instant('PERSONAL_STATS.TOTAL'), 
                color: 'var(--mat-sys-on-background)' 
              } 
            } 
          } 
        }
      };

      this.donutSeries = [
        data.repartitionAbsences.conges,
        data.repartitionAbsences.absences,
        data.repartitionAbsences.recuperations,
      ];

      this.barSeries = [
        { name: this.translateService.instant('PERSONAL_STATS.WORKED_HOURS'), data: [...data.evolutionHeuresMensuel.heuresTravaillees] },
        { name: this.translateService.instant('PERSONAL_STATS.CREDIT_DEBIT_HOURS'), data: [...data.evolutionHeuresMensuel.creditDebit] },
      ];

      this.barXAxis = { ...this.barXAxis, categories: [...data.evolutionHeuresMensuel.mois] };
    });
  }
}
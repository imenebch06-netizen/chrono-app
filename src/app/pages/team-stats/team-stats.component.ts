import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
  imports: [CommonModule, MatIconModule, NgApexchartsModule, TranslateModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 space-y-6">
      @if (teamStats(); as t) {
        <div class="flex items-center justify-between bg-[var(--mat-sys-surface)] p-15 rounded-2xl border border-[var(--mat-sys-outline)] shadow-sm">
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-[var(--mat-sys-on-background)] tracking-tight">
              {{ 'STATISTIQUES.TEAM.TITLE' | translate }}
            </h1>
            <p class="text-[var(--mat-sys-on-background)]/60 text-xs sm:text-sm mt-0.5">
              {{ 'STATISTIQUES.TEAM.SUBTITLE' | translate }} • <strong>{{ t.organizationNom }}</strong>
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div class="bg-[var(--mat-sys-surface)] p-10 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:border-[var(--mat-sys-primary)]/40 transition-all">
            <div class="space-y-1 z-10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--mat-sys-on-background)]/40">
                {{ 'STATISTIQUES.TEAM.TOTAL_MEMBERS' | translate }}
              </span>
              <h3 class="text-2xl font-black text-[var(--mat-sys-on-background)]">{{ t.totalSubordonnes }}</h3>
            </div>
            <div class="p-3 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-xl group-hover:scale-105 transition-transform">
              <mat-icon>groups</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-10 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:border-[var(--mat-sys-primary)]/40 transition-all">
            <div class="space-y-1 z-10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--mat-sys-on-background)]/40">
                {{ 'STATISTIQUES.TEAM.PRESENT_TODAY' | translate }}
              </span>
              <h3 class="text-2xl font-black text-[var(--mat-sys-primary)]">{{ t.presentsAujourdhui }}</h3>
            </div>
            <div class="p-3 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-xl group-hover:scale-105 transition-transform">
              <mat-icon>how_to_reg</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-10 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:border-[var(--mat-sys-primary)]/40 transition-all">
            <div class="space-y-1 z-10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--mat-sys-on-background)]/40">
                {{ 'STATISTIQUES.TEAM.ABSENT_LEAVE' | translate }}
              </span>
              <h3 class="text-2xl font-black text-[var(--mat-sys-on-background)]">{{ t.enCongeAujourdhui }}</h3>
            </div>
            <div class="p-3 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-xl group-hover:scale-105 transition-transform">
              <mat-icon>event_busy</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-10 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:border-[var(--mat-sys-primary)]/40 transition-all">
            <div class="space-y-1 z-10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--mat-sys-on-background)]/40">
                {{ 'STATISTIQUES.TEAM.PENDING_APPROVAL' | translate }}
              </span>
              <h3 class="text-2xl font-black text-[var(--mat-sys-on-background)]">{{ t.demandesEnAttenteValidation }}</h3>
            </div>
            <div class="p-3 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-xl group-hover:scale-105 transition-transform">
              <mat-icon>rule</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>
        </div>

        <div class="bg-[var(--mat-sys-surface)] p-15 sm:p-8 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)]">
          <h2 class="text-lg font-bold text-[var(--mat-sys-on-background)] mb-6 flex items-center gap-2">
            <mat-icon class="text-[var(--mat-sys-primary)]">bar_chart</mat-icon>
            {{ 'STATISTIQUES.TEAM.ABSENCE_BREAKDOWN' | translate }}
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
        <div class="flex items-center justify-center p-16 bg-[var(--mat-sys-surface)] rounded-2xl border border-[var(--mat-sys-outline)]">
          <p class="text-xs text-[var(--mat-sys-on-background)]/40 font-medium animate-pulse">
            {{ 'STATISTIQUES.TEAM.LOADING' | translate }}
          </p>
        </div>
      }
    </div>
  `,
})
export class TeamStatsComponent implements OnInit {
  private statsService = inject(StatistiquesService);
  private translateService = inject(TranslateService);

  teamStats = signal<TeamStats | null>(null);

  chartColors = ['#635BFF', '#8F88FF', '#B5B0FF', '#DAD7FF', '#EDEBFF'];

  typeAbsenceSeries: ApexAxisChartSeries = [];
  typeAbsenceChart: ApexChart = { type: 'bar', height: 320, toolbar: { show: false }, background: 'transparent' };
  typeAbsenceXAxis: ApexXAxis = { categories: [], labels: { style: { colors: 'var(--mat-sys-on-background)' } } };
  typeAbsenceYAxis: ApexYAxis = { labels: { style: { colors: 'var(--mat-sys-on-background)' } } };
  typeAbsencePlotOptions: ApexPlotOptions = {
    bar: { horizontal: false, columnWidth: '40%', borderRadius: 8, distributed: true }
  };
  chartDataLabels: ApexDataLabels = { enabled: true };
  chartTooltip: ApexTooltip = { theme: 'dark' };

  ngOnInit(): void {
    this.statsService.getTeamStats().subscribe((data) => {
      this.teamStats.set(data);
      this.typeAbsenceSeries = [{ 
        name: this.translateService.instant('STATISTIQUES.TEAM.ABSENCE_COUNT'), 
        data: [...data.absencesParType.series] 
      }];
      this.typeAbsenceXAxis = { ...this.typeAbsenceXAxis, categories: [...data.absencesParType.labels] };
    });
  }
}
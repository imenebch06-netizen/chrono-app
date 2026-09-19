import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
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
  imports: [CommonModule, MatCardModule, MatIconModule, NgApexchartsModule, TranslateModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 space-y-6">
      <!-- En-tête Unifié -->
      <div class="flex items-center justify-between bg-[var(--mat-sys-surface)] p-15 rounded-2xl border border-[var(--mat-sys-outline)] shadow-sm">
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-[var(--mat-sys-on-background)] tracking-tight">
            {{ 'ADMIN_STATS.TITLE' | translate }}
          </h1>
          <p class="text-[var(--mat-sys-on-background)]/60 text-xs sm:text-sm mt-0.5">
            {{ 'ADMIN_STATS.SUBTITLE' | translate }}
          </p>
        </div>
      </div>

      @if (adminStats(); as a) {
        <!-- Cartes d'indicateurs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div class="bg-[var(--mat-sys-surface)] p-10 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:border-[var(--mat-sys-primary)]/40 transition-all">
            <div class="space-y-1 z-10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--mat-sys-on-background)]/40">
                {{ 'ADMIN_STATS.CARDS.TOTAL_EMPLOYEES' | translate }}
              </span>
              <h3 class="text-2xl font-black text-[var(--mat-sys-on-background)]">{{ a.totalEmployes }}</h3>
            </div>
            <div class="p-3 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-xl group-hover:scale-105 transition-transform">
              <mat-icon>people</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-10 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:border-[var(--mat-sys-primary)]/40 transition-all">
            <div class="space-y-1 z-10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--mat-sys-on-background)]/40">
                {{ 'ADMIN_STATS.CARDS.ORGANIZATIONS' | translate }}
              </span>
              <h3 class="text-2xl font-black text-[var(--mat-sys-on-background)]">{{ a.totalOrganizations }}</h3>
            </div>
            <div class="p-3 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-xl group-hover:scale-105 transition-transform">
              <mat-icon>corporate_fare</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-10 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:border-[var(--mat-sys-primary)]/40 transition-all">
            <div class="space-y-1 z-10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--mat-sys-on-background)]/40">
                {{ 'ADMIN_STATS.CARDS.GLOBAL_ATTENDANCE' | translate }}
              </span>
              <h3 class="text-2xl font-black text-[var(--mat-sys-primary)]">{{ a.tauxPresenceGlobal }}%</h3>
            </div>
            <div class="p-3 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-xl group-hover:scale-105 transition-transform">
              <mat-icon>trending_up</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>

          <div class="bg-[var(--mat-sys-surface)] p-10 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)] flex items-center justify-between relative overflow-hidden group hover:border-[var(--mat-sys-primary)]/40 transition-all">
            <div class="space-y-1 z-10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--mat-sys-on-background)]/40">
                {{ 'ADMIN_STATS.CARDS.PENDING_REQUESTS' | translate }}
              </span>
              <h3 class="text-2xl font-black text-[var(--mat-sys-on-background)]">{{ a.demandesEnAttenteTotales }}</h3>
            </div>
            <div class="p-3 bg-[var(--mat-sys-primary-fixed-dim)] text-[var(--mat-sys-primary)] rounded-lg group-hover:scale-105 transition-transform">
              <mat-icon>pending_actions</mat-icon>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--mat-sys-primary)]"></div>
          </div>
        </div>

        <!-- Graphique Répartition -->
        <div class="bg-[var(--mat-sys-surface)] p-15 sm:p-8 rounded-2xl shadow-sm border border-[var(--mat-sys-outline)] max-w-4xl mx-auto">
          <h2 class="text-lg font-bold text-[var(--mat-sys-on-background)] mb-6 flex items-center gap-2">
            <mat-icon class="text-[var(--mat-sys-primary)]">donut_large</mat-icon>
            {{ 'ADMIN_STATS.CHART_TITLE' | translate }}
          </h2>
          <div class="w-full flex justify-center min-h-[350px]">
            <apx-chart
              [series]="donutSeries"
              [chart]="donutChart"
              [labels]="chartLabels()"
              [colors]="chartColors"
              [plotOptions]="donutPlotOptions"
              [legend]="chartLegend"
              [dataLabels]="chartDataLabels"
              [tooltip]="chartTooltip">
            </apx-chart>
          </div>
        </div>
      } @else {
        <div class="flex items-center justify-center p-16 bg-[var(--mat-sys-surface)] rounded-2xl border border-[var(--mat-sys-outline)]">
          <p class="text-xs text-[var(--mat-sys-on-background)]/40 font-medium animate-pulse">
            {{ 'ADMIN_STATS.LOADING' | translate }}
          </p>
        </div>
      }
    </div>
  `,
})
export class AdminStatsComponent implements OnInit, OnDestroy {
  private statsService = inject(StatistiquesService);
  private translateService = inject(TranslateService);
  private langSub!: Subscription;

  adminStats = signal<AdminGlobalStats | null>(null);
  chartLabels = signal<string[]>([]);

  chartColors = ['#635BFF', '#8F88FF', '#C7C3FF'];

  donutSeries: ApexNonAxisChartSeries = [];
  donutChart: ApexChart = { type: 'donut', height: 350, animations: { enabled: true }, background: 'transparent' };
  donutPlotOptions: ApexPlotOptions = {
    pie: { 
      donut: { 
        size: '70%', 
        labels: { 
          show: true, 
          total: { show: true, label: 'Total', color: 'var(--mat-sys-on-background)' } 
        } 
      } 
    }
  };
  chartLegend: ApexLegend = { position: 'bottom', fontSize: '13px', labels: { colors: 'var(--mat-sys-on-background)' } };
  chartDataLabels: ApexDataLabels = { enabled: true };
  chartTooltip: ApexTooltip = { theme: 'dark' };

  ngOnInit(): void {
    // Réaction immédiate aux changements de langue
    this.langSub = this.translateService.onLangChange.subscribe(() => {
      this.updateTranslations();
    });

    this.statsService.getAdminStats().subscribe((data) => {
      this.adminStats.set(data);
      this.donutSeries = [...data.repartitionDemandesGlobales.series];
      this.updateTranslations();
    });
  }

  private updateTranslations(): void {
    const stats = this.adminStats();
    if (!stats) return;

    // 1. Traduction des libellés du graphique
    const keys = stats.repartitionDemandesGlobales.labels;
    this.translateService.get(keys).subscribe((res: Record<string, string>) => {
      this.chartLabels.set(keys.map(k => res[k] || k));
    });

    // 2. Traduction du mot "Total" au centre de l'anneau
    this.translateService.get('ADMIN_STATS.CHART_TOTAL').subscribe((label: string) => {
      this.donutPlotOptions = {
        ...this.donutPlotOptions,
        pie: {
          ...this.donutPlotOptions.pie,
          donut: {
            ...this.donutPlotOptions.pie?.donut,
            labels: {
              ...this.donutPlotOptions.pie?.donut?.labels,
              total: {
                ...this.donutPlotOptions.pie?.donut?.labels?.total,
                label: label
              }
            }
          }
        }
      };
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }
}
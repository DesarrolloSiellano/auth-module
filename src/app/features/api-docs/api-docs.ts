import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import 'chart.js/auto';
import { Chart } from 'chart.js';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';

import { NotificationService } from '../../core/services/notification.service';
import { ApiDocsService } from './services/api-docs.service';
import {
  ApiRestDocs,
  ApiRestEndpoint,
  ApiTcpCommand,
  ApiTcpDocs,
} from './interfaces/api-docs.interface';

interface DomainCount {
  domain: string;
  count: number;
}

type DocsTab = 'tcp' | 'rest';

const CHART_COLORS = [
  '#4f46e5',
  '#2563eb',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#64748b',
  '#0891b2',
];

const METHOD_COLORS: Record<string, string> = {
  GET: '#2563eb',
  POST: '#16a34a',
  PUT: '#d97706',
  PATCH: '#7c3aed',
  DELETE: '#dc2626',
};

@Component({
  selector: 'app-api-docs',
  imports: [
    CommonModule,
    FormsModule,
    Button,
    Dialog,
    InputText,
    Select,
    TableModule,
  ],
  templateUrl: './api-docs.html',
  styleUrl: './api-docs.scss',
})
export class ApiDocsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly apiDocsService = inject(ApiDocsService);
  private readonly notification = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('tcpChart') tcpChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('restChart') restChartRef?: ElementRef<HTMLCanvasElement>;

  activeTab: DocsTab = 'tcp';
  loading = false;
  failed = false;
  search = '';
  domain = 'all';

  tcp: ApiTcpDocs | null = null;
  rest: ApiRestDocs | null = null;

  selectedEndpoint: ApiRestEndpoint | null = null;
  endpointDialogVisible = false;

  readonly methodColors = METHOD_COLORS;

  private viewReady = false;
  private tcpChart?: Chart;
  private restChart?: Chart;
  private expanded = new Set<string>();

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderActiveChart();
  }

  ngOnDestroy(): void {
    this.tcpChart?.destroy();
    this.restChart?.destroy();
  }

  loadAll(): void {
    this.loading = true;
    this.failed = false;

    let pending = 2;
    const settle = () => {
      pending -= 1;
      if (pending > 0) return;
      this.loading = false;
      this.cdr.detectChanges();
      this.renderActiveChart();
    };

    this.apiDocsService
      .getTcpDocs()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.tcp = this.unwrap<ApiTcpDocs>(res);
          settle();
        },
        error: (err) => this.fail(err, 'No se pudo cargar la documentación TCP', settle),
      });

    this.apiDocsService
      .getRestDocs()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.rest = this.unwrap<ApiRestDocs>(res);
          settle();
        },
        error: (err) => this.fail(err, 'No se pudo cargar la documentación REST', settle),
      });
  }

  /** Admite respuestas envueltas (`{ data }`) o el objeto directo. */
  private unwrap<T>(res: any): T {
    return (res && typeof res === 'object' && 'data' in res ? res.data : res) as T;
  }

  private fail(err: any, fallback: string, settle: () => void): void {
    this.failed = true;
    this.notification.error(
      'Documentación del API',
      err?.error?.message || fallback,
    );
    settle();
  }

  setTab(tab: DocsTab): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.domain = 'all';
    this.tcpChart?.destroy();
    this.restChart?.destroy();
    this.tcpChart = undefined;
    this.restChart = undefined;
    this.cdr.detectChanges();
    this.renderActiveChart();
  }

  // ------------------------------------------------------------- Derivados

  domainOptions(): { label: string; value: string }[] {
    const domains =
      this.activeTab === 'tcp'
        ? this.tcp?.domains || []
        : this.rest?.domains || [];
    return [
      { label: 'Todos los dominios', value: 'all' },
      ...domains.map((d) => ({ label: d, value: d })),
    ];
  }

  filteredTcp(): ApiTcpCommand[] {
    const term = this.search.trim().toLowerCase();
    return (this.tcp?.commands || []).filter((c) => {
      if (this.domain !== 'all' && c.domain !== this.domain) return false;
      if (!term) return true;
      return (
        c.command.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.domain.toLowerCase().includes(term)
      );
    });
  }

  filteredRest(): ApiRestEndpoint[] {
    const term = this.search.trim().toLowerCase();
    return (this.rest?.endpoints || []).filter((e) => {
      if (this.domain !== 'all' && this.pathDomain(e.path) !== this.domain) {
        return false;
      }
      if (!term) return true;
      return (
        e.path.toLowerCase().includes(term) ||
        e.description.toLowerCase().includes(term) ||
        e.method.toLowerCase().includes(term) ||
        e.auth.toLowerCase().includes(term)
      );
    });
  }

  pathDomain(path: string): string {
    return path.split('/')[2] || '';
  }

  tcpDomainCounts(): DomainCount[] {
    const map = new Map<string, number>();
    (this.tcp?.commands || []).forEach((c) =>
      map.set(c.domain, (map.get(c.domain) || 0) + 1),
    );
    return Array.from(map.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);
  }

  restMethodCounts(): DomainCount[] {
    const map = new Map<string, number>();
    (this.rest?.endpoints || []).forEach((e) =>
      map.set(e.method, (map.get(e.method) || 0) + 1),
    );
    return Array.from(map.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);
  }

  restDomainCounts(): DomainCount[] {
    const map = new Map<string, number>();
    (this.rest?.endpoints || []).forEach((e) => {
      const d = this.pathDomain(e.path);
      map.set(d, (map.get(d) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);
  }

  totalRestEndpoints(): number {
    return this.rest?.total || 0;
  }

  totalTcpCommands(): number {
    return this.tcp?.total || 0;
  }

  totalDomains(): number {
    return Math.max(
      this.tcp?.domains?.length || 0,
      this.rest?.domains?.length || 0,
    );
  }

  totalMethods(): number {
    return this.restMethodCounts().length;
  }

  // -------------------------------------------------------------- Detalle

  openEndpoint(row: ApiRestEndpoint): void {
    this.selectedEndpoint = row;
    this.endpointDialogVisible = true;
  }

  closeEndpoint(): void {
    this.endpointDialogVisible = false;
    this.selectedEndpoint = null;
  }

  toggleExpand(key: string): void {
    if (this.expanded.has(key)) this.expanded.delete(key);
    else this.expanded.add(key);
  }

  isExpanded(key: string): boolean {
    return this.expanded.has(key);
  }

  formatJson(value: unknown): string {
    try {
      return JSON.stringify(value ?? {}, null, 2);
    } catch {
      return '{}';
    }
  }

  async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.notification.success('Documentación del API', 'Copiado al portapapeles');
    } catch {
      this.notification.error('Documentación del API', 'No se pudo copiar');
    }
  }

  // --------------------------------------------------------------- Charts

  private renderActiveChart(): void {
    if (!this.viewReady) return;
    // Espera a que el @if pinte el canvas correspondiente.
    setTimeout(() => {
      if (this.activeTab === 'tcp') this.renderTcpChart();
      else this.renderRestChart();
    });
  }

  private renderTcpChart(): void {
    const canvas = this.tcpChartRef?.nativeElement;
    if (!canvas || !this.tcp) return;
    this.tcpChart?.destroy();
    const counts = this.tcpDomainCounts();
    this.tcpChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: counts.map((c) => c.domain),
        datasets: [
          {
            data: counts.map((c) => c.count),
            backgroundColor: counts.map(
              (_, i) => CHART_COLORS[i % CHART_COLORS.length],
            ),
            borderColor: '#ffffff',
            borderWidth: 3,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 12, boxHeight: 12, usePointStyle: true },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.parsed} comandos`,
            },
          },
        },
      },
    });
  }

  private renderRestChart(): void {
    const canvas = this.restChartRef?.nativeElement;
    if (!canvas || !this.rest) return;
    this.restChart?.destroy();
    const domains = this.restDomainCounts();
    this.restChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: domains.map((d) => d.domain),
        datasets: [
          {
            label: 'Endpoints',
            data: domains.map((d) => d.count),
            backgroundColor: '#4f46e5',
            borderRadius: 8,
            maxBarThickness: 46,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} endpoint(s)`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: 'rgba(148, 163, 184, 0.18)' },
          },
        },
      },
    });
  }
}

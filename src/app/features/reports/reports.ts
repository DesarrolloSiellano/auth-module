import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import FileSaver from 'file-saver';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Tag } from 'primeng/tag';

import { NotificationService } from '../../core/services/notification.service';
import { SessionStore } from '../../core/services/session.store';
import { TableExportService } from '../../shared/services/table-export.service';
import { ReportsService } from './services/reports.service';
import {
  ReportCatalogItem,
  ReportFilter,
  ReportPreview,
} from './interfaces/report.interface';

@Component({
  selector: 'app-reports',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Button,
    InputText,
    Select,
    DatePicker,
    Tag,
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class ReportsComponent implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly notification = inject(NotificationService);
  private readonly session = inject(SessionStore);
  private readonly exporter = inject(TableExportService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  get isSuperAdmin(): boolean {
    return this.session.getClaims()?.isSuperAdmin === true;
  }

  /** El filtro "empresa" solo aplica a SuperAdmin (el resto ve su empresa). */
  visibleFilters(): ReportFilter[] {
    return (this.selected?.filters || []).filter(
      (filter) => this.isSuperAdmin || filter.key !== 'empresa',
    );
  }

  catalog: ReportCatalogItem[] = [];
  selected: ReportCatalogItem | null = null;
  filters: Record<string, any> = {};
  preview: ReportPreview | null = null;
  loading = false;
  loadingCatalog = false;
  exporting = false;

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.loadingCatalog = true;
    this.reportsService
      .getCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (res) => {
        this.catalog = res.data || [];
        this.loadingCatalog = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingCatalog = false;
        this.notification.error(
          'Reportes',
          err?.error?.message || 'No se pudo cargar el catálogo',
        );
        this.cdr.detectChanges();
      },
    });
  }

  selectReport(report: ReportCatalogItem): void {
    this.selected = report;
    this.preview = null;
    this.filters = {};
    for (const filter of report.filters || []) {
      this.filters[filter.key] = filter.type === 'date' ? null : '';
    }
  }

  runPreview(): void {
    if (!this.selected || this.loading) return;
    this.loading = true;
    this.reportsService
      .preview(this.selected.id, this.buildFilters(), 50)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.preview = res.data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.notification.error(
            'Reportes',
            err?.error?.message || 'No se pudo generar la vista previa',
          );
          this.cdr.detectChanges();
        },
      });
  }

  exportReport(format: 'xlsx' | 'csv' | 'pdf'): void {
    if (!this.selected || this.exporting) return;
    this.exporting = true;

    // El PDF se genera en el navegador (impresión) a partir del dataset JSON.
    if (format === 'pdf') {
      this.reportsService
        .data(this.selected.id, this.buildFilters())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
        next: async (res) => {
          const d = res.data;
          if (d.truncated) {
            this.notification.warn(
              'Reportes',
              `El PDF incluirá las primeras ${d.rows.length} de ${d.total} filas. Para el total usa Excel/CSV.`,
            );
          }
          await this.exporter.printPdf({
            title: d.nombre,
            meta: `Generado: ${new Date().toLocaleString('es-CO')}`,
            columns: d.columns,
            rows: d.rows,
            summary: d.summary,
            chart: d.chart ?? null,
          });
          this.exporting = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.exporting = false;
          this.notification.error(
            'Reportes',
            err?.error?.message || 'No se pudo generar el PDF',
          );
          this.cdr.detectChanges();
        },
      });
      return;
    }

    this.reportsService
      .export(this.selected.id, this.buildFilters(), format)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (file) => {
          FileSaver.saveAs(file.blob, file.filename);
          this.exporting = false;
          this.notification.success(
            'Reportes',
            `Descarga ${format.toUpperCase()} generada`,
          );
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.exporting = false;
          this.notification.error(
            'Reportes',
            err?.error?.message || 'No se pudo exportar el reporte',
          );
          this.cdr.detectChanges();
        },
      });
  }

  clearFilters(): void {
    if (!this.selected) return;
    this.filters = {};
    for (const filter of this.selected.filters || []) {
      this.filters[filter.key] = filter.type === 'date' ? null : '';
    }
    this.preview = null;
  }

  private buildFilters(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (!this.selected) return out;
    for (const filter of this.selected.filters || []) {
      const value = this.filters[filter.key];
      if (value === '' || value === null || value === undefined) continue;
      out[filter.key] =
        filter.type === 'date' && value instanceof Date
          ? value.toISOString().slice(0, 10)
          : value;
    }
    return out;
  }
}

import { Injectable } from '@angular/core';
import Chart from 'chart.js/auto';

export interface ExportColumn {
  key: string;
  label: string;
  type?: string;
  align?: string;
}

export interface ExportSummaryItem {
  label: string;
  value: string | number;
}

export interface ExportChart {
  type: string;
  labels: string[];
  datasets: Array<Record<string, unknown>>;
}

export interface PrintPdfParams {
  title: string;
  meta?: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  summary?: ExportSummaryItem[];
  chart?: ExportChart | null;
}

/**
 * Genera el PDF en el navegador usando la impresión nativa (sin Puppeteer en
 * el servidor). Construye un contenedor fuera de pantalla, renderiza el
 * gráfico con Chart.js y lanza el diálogo de impresión.
 */
@Injectable({ providedIn: 'root' })
export class TableExportService {
  async printPdf(params: PrintPdfParams): Promise<void> {
    const container = document.createElement('div');
    container.className = 'print-report';
    container.innerHTML = this.buildHtml(params);
    document.body.appendChild(container);
    document.body.classList.add('printing-report');

    let chart: Chart | null = null;
    if (params.chart && params.chart.labels?.length) {
      const canvas = container.querySelector<HTMLCanvasElement>('#print-chart');
      if (canvas) {
        chart = new Chart(canvas, {
          type: params.chart.type,
          data: {
            labels: params.chart.labels,
            datasets: params.chart.datasets,
          },
          options: {
            responsive: false,
            animation: false,
            plugins: { legend: { position: 'bottom' } },
            scales:
              params.chart.type === 'bar' || params.chart.type === 'line'
                ? { y: { beginAtZero: true } }
                : undefined,
          },
        } as never);
      }
    }

    // Espera un frame para asegurar que el canvas/animación esté listo.
    await new Promise((resolve) => setTimeout(resolve, 120));

    let cleaned = false;
    const cleanup = (): void => {
      if (cleaned) return;
      cleaned = true;
      chart?.destroy();
      container.remove();
      document.body.classList.remove('printing-report');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    window.print();
    // Respaldo por si el navegador no dispara `afterprint`.
    setTimeout(cleanup, 2000);
  }

  private escapeHtml(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private formatValue(value: unknown, type?: string): string {
    if (value === null || value === undefined || value === '') return '';
    if (type === 'date') {
      const d = new Date(value as string);
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    const n = Number(value);
    if (type === 'number') {
      return Number.isNaN(n) ? String(value) : n.toLocaleString('es-CO');
    }
    if (type === 'currency') {
      return Number.isNaN(n) ? String(value) : '$' + n.toLocaleString('es-CO');
    }
    if (type === 'percent') {
      return Number.isNaN(n) ? String(value) : `${n}%`;
    }
    return String(value);
  }

  private buildHtml(params: PrintPdfParams): string {
    const { title, meta, columns, rows, summary, chart } = params;

    const head = columns
      .map((c) => {
        const align = c.align || (c.type && c.type !== 'text' ? 'right' : 'left');
        return `<th style="text-align:${align}">${this.escapeHtml(c.label)}</th>`;
      })
      .join('');

    const body = rows
      .map((row, idx) => {
        const cells = columns
          .map((c) => {
            const align =
              c.align || (c.type && c.type !== 'text' ? 'right' : 'left');
            return `<td style="text-align:${align}">${this.escapeHtml(
              this.formatValue(row[c.key], c.type),
            )}</td>`;
          })
          .join('');
        return `<tr class="${idx % 2 === 1 ? 'zebra' : ''}">${cells}</tr>`;
      })
      .join('');

    const summaryHtml =
      summary && summary.length
        ? `<div class="pr-summary"><h3>Resumen</h3>${summary
            .map(
              (s) =>
                `<div class="pr-summary-item"><span>${this.escapeHtml(
                  s.label,
                )}:</span> <strong>${this.escapeHtml(s.value)}</strong></div>`,
            )
            .join('')}</div>`
        : '';

    const chartHtml =
      chart && chart.labels?.length
        ? `<div class="pr-chart"><canvas id="print-chart" width="960" height="320"></canvas></div>`
        : '';

    return `
      <style>
        .print-report { display: none; }
        @media print {
          body.printing-report > *:not(.print-report) { display: none !important; }
          body.printing-report .print-report { display: block !important; }
        }
        .print-report { padding: 16px; color: #1e293b; font-family: Arial, Helvetica, sans-serif; }
        .print-report .pr-title { font-size: 18px; font-weight: 700; color: #2d3a74; margin: 0 0 2px; }
        .print-report .pr-meta { font-size: 10px; color: #64748b; font-style: italic; margin-bottom: 10px; }
        .print-report table { border-collapse: collapse; width: 100%; table-layout: fixed; }
        .print-report th { background: #2d3a74; color: #fff; font-size: 9px; padding: 6px 5px; border: 1px solid #d0d9e2; }
        .print-report td { font-size: 8.5px; padding: 5px; border: 1px solid #d0d9e2; word-wrap: break-word; }
        .print-report tr.zebra td { background: #f1f5f9; }
        .print-report .pr-chart { margin-bottom: 14px; }
        .print-report .pr-summary { margin-top: 14px; font-size: 11px; }
        .print-report .pr-summary h3 { color: #2d3a74; margin: 0 0 6px; }
      </style>
      <div class="pr-title">${this.escapeHtml(title)}</div>
      ${meta ? `<div class="pr-meta">${this.escapeHtml(meta)}</div>` : ''}
      ${chartHtml}
      <table>
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
      ${summaryHtml}
    `;
  }
}

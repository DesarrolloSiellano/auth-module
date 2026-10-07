import { PolicyDefinition } from '../interfaces/tenant-config.interface';

export interface PolicyItem {
  key: string;
  label: string;
  value: unknown;
  unit?: string;
}

export type QuotaState = 'ok' | 'warn' | 'danger' | 'unlimited';

export interface QuotaBar {
  key: string;
  label: string;
  limit: number;
  used: number;
  unit?: string;
  metric: string;
  unlimited: boolean;
  exceeded: boolean;
  percent: number;
  state: QuotaState;
}

/**
 * Mapea cada política de cuota con la métrica de uso reportada que la
 * consume (mismo criterio que el reporte "Uso vs cuotas").
 */
export const QUOTA_USAGE_MAP: Record<string, string> = {
  'channels.sms.monthlyLimit': 'sms.sent',
  'channels.audio.monthlyLimit': 'audio.sent',
  'channels.email.monthlyLimit': 'email.sent',
  'channels.whatsapp.monthlyLimit': 'whatsapp.sent',
  'messages.texto.limit': 'sms.sent',
  'messages.audio.limit': 'audio.sent',
  'messages.bolsa.utilidad': 'whatsapp.utilidad',
  'messages.bolsa.marketingComercial': 'whatsapp.marketingComercial',
  'messages.bolsa.autenticacion': 'whatsapp.autenticacion',
  'messages.bolsa.servicio': 'whatsapp.servicio',
};

/** Políticas que representan una cuota/límite mostrable en el dashboard. */
export function isQuotaPolicy(key: string): boolean {
  return (
    (key.startsWith('channels.') && key.endsWith('.monthlyLimit')) ||
    key.startsWith('messages.') ||
    key.startsWith('limits.')
  );
}

export function toQuotaItems(
  catalog: PolicyDefinition[],
  configValues: Record<string, unknown>,
): PolicyItem[] {
  return catalog
    .filter((def) => isQuotaPolicy(def.key))
    .map((def) => ({
      key: def.key,
      label: def.label,
      value: configValues[def.key],
      unit: def.unit,
    }));
}

/** Cuotas numéricas con su barra de carga (uso vs límite). */
export function buildQuotaBars(
  quotas: PolicyItem[],
  usedByMetric: Map<string, number>,
  excludeKeys: string[] = ['limits.trialDays'],
): QuotaBar[] {
  return quotas
    .filter((quota) => !excludeKeys.includes(quota.key))
    .map((quota) => {
      const limit = Number(quota.value) || 0;
      const unlimited = limit <= 0;
      const metric = QUOTA_USAGE_MAP[quota.key] || '';
      const usedValue = metric ? usedByMetric.get(metric) || 0 : 0;
      const percent = unlimited
        ? 100
        : Math.min(100, Math.round((usedValue / limit) * 100));
      const exceeded = !unlimited && usedValue > limit;
      const state: QuotaState = unlimited
        ? 'unlimited'
        : exceeded || percent >= 90
          ? 'danger'
          : percent >= 80
            ? 'warn'
            : 'ok';
      return {
        key: quota.key,
        label: quota.label,
        limit,
        used: usedValue,
        unit: quota.unit,
        metric,
        unlimited,
        exceeded,
        percent,
        state,
      };
    });
}

/**
 * Aplana un objeto de métricas anidado a claves con puntos
 * (`{ whatsapp: { sent: 5 } }` → `{ 'whatsapp.sent': 5 }`) y coerciona a
 * número, descartando valores no finitos. Evita renderizar `[object Object]`.
 */
export function flattenMetrics(
  input: unknown,
  prefix = '',
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out;

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flattenMetrics(value, path));
      continue;
    }
    const num = Number(value);
    if (Number.isFinite(num)) out[path] = num;
  }
  return out;
}

/** Mes actual en formato `YYYY-MM`. */
export function currentPeriod(from: Date = new Date()): string {
  const year = from.getFullYear();
  const month = String(from.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Períodos seleccionables: solo los existentes (válidos, únicos), ordenados
 * de más reciente a más antiguo. No sintetiza meses.
 */
export function buildUsagePeriods(periods: string[]): string[] {
  const unique = new Set<string>();
  for (const raw of periods || []) {
    const period = String(raw ?? '').trim();
    if (/^\d{4}-\d{2}$/.test(period)) unique.add(period);
  }
  return Array.from(unique).sort().reverse();
}

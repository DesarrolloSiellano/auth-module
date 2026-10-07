import { PolicyDefinition } from '../interfaces/tenant-config.interface';

export interface PolicyItem {
  key: string;
  label: string;
  value: unknown;
  unit?: string;
}

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

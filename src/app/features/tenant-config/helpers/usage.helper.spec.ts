import {
  buildQuotaBars,
  buildUsagePeriods,
  currentPeriod,
  flattenMetrics,
  toQuotaItems,
} from './usage.helper';

describe('usage.helper', () => {
  describe('flattenMetrics', () => {
    it('aplana objetos anidados a claves con punto', () => {
      const result = flattenMetrics({
        whatsapp: { sent: 5, delivered: 3 },
        'sms.sent': 2,
      });

      expect(result).toEqual({
        'whatsapp.sent': 5,
        'whatsapp.delivered': 3,
        'sms.sent': 2,
      });
    });

    it('descarta valores no numéricos', () => {
      expect(flattenMetrics({ a: 'x', b: null, c: {}, d: 4 })).toEqual({
        d: 4,
      });
    });
  });

  describe('buildUsagePeriods', () => {
    it('devuelve solo los períodos existentes, ordenados desc', () => {
      const periods = buildUsagePeriods([
        '2026-05',
        '2026-09',
        '2026-09',
        'invalido',
        '2026-01',
      ]);

      expect(periods).toEqual(['2026-09', '2026-05', '2026-01']);
    });

    it('devuelve arreglo vacío cuando no hay períodos', () => {
      expect(buildUsagePeriods([])).toEqual([]);
    });
  });

  describe('currentPeriod', () => {
    it('formatea el mes actual como YYYY-MM', () => {
      expect(currentPeriod(new Date(2026, 0, 15))).toBe('2026-01');
    });
  });

  describe('buildQuotaBars', () => {
    it('calcula uso vs límite y estado', () => {
      const catalog: any = [
        {
          key: 'channels.sms.monthlyLimit',
          label: 'SMS por mes',
          group: 'channels',
          type: 'number',
          defaultValue: 10,
          unit: 'mensajes/mes',
        },
        {
          key: 'limits.trialDays',
          label: 'Días de prueba',
          group: 'limits',
          type: 'number',
          defaultValue: 7,
        },
      ];
      const quotas = toQuotaItems(catalog, {
        'channels.sms.monthlyLimit': 10,
        'limits.trialDays': 7,
      });
      const bars = buildQuotaBars(
        quotas,
        new Map<string, number>([['sms.sent', 9]]),
      );

      expect(bars.map((b) => b.key)).toEqual(['channels.sms.monthlyLimit']);
      expect(bars[0].used).toBe(9);
      expect(bars[0].percent).toBe(90);
      expect(bars[0].state).toBe('danger');
    });
  });
});

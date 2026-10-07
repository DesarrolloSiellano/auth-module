import { isQuotaPolicy, toQuotaItems } from './usage.helper';

describe('usage.helper', () => {
  describe('isQuotaPolicy', () => {
    it('detecta límites de canales, mensajes y limits.*', () => {
      expect(isQuotaPolicy('channels.sms.monthlyLimit')).toBe(true);
      expect(isQuotaPolicy('messages.bolsa.utilidad')).toBe(true);
      expect(isQuotaPolicy('limits.maxUsers')).toBe(true);
      expect(isQuotaPolicy('features.pbx')).toBe(false);
      expect(isQuotaPolicy('general.timezone')).toBe(false);
    });
  });

  describe('toQuotaItems', () => {
    it('mapea el catálogo con sus valores de configuración', () => {
      const catalog: any = [
        {
          key: 'channels.sms.monthlyLimit',
          label: 'SMS por mes',
          group: 'channels',
          type: 'number',
          defaultValue: 3000,
          unit: 'mensajes/mes',
        },
        {
          key: 'features.pbx',
          label: 'PBX',
          group: 'features',
          type: 'boolean',
          defaultValue: false,
        },
      ];

      const items = toQuotaItems(catalog, { 'channels.sms.monthlyLimit': 10 });

      expect(items.length).toBe(1);
      expect(items[0]).toEqual(
        jasmine.objectContaining({
          key: 'channels.sms.monthlyLimit',
          label: 'SMS por mes',
          value: 10,
          unit: 'mensajes/mes',
        }),
      );
    });
  });
});

import { filterAndSort } from './filterAndSort';
import { FormFieldConfig } from '../../../forms/form-field.model';

describe('filterAndSort', () => {
  const fields: FormFieldConfig[] = [
    { name: 'hidden', label: 'H', type: 'text', show: false, weight: 1 },
    { name: 'second', label: '2', type: 'text', show: true, weight: 2 },
    { name: 'first', label: '1', type: 'text', show: true, weight: 1 },
    { name: 'noWeight', label: '0', type: 'text', show: true },
  ];

  it('should filter out hidden fields', () => {
    const result = filterAndSort(fields);
    expect(result.map((f) => f.name)).not.toContain('hidden');
  });

  it('should sort by weight ascending', () => {
    const result = filterAndSort(fields);
    expect(result.map((f) => f.name)).toEqual(['noWeight', 'first', 'second']);
  });

  it('should default missing weights to 0', () => {
    const result = filterAndSort([{ name: 'x', label: 'X', type: 'text', show: true }]);
    expect(result[0].weight).toBe(0);
  });
});

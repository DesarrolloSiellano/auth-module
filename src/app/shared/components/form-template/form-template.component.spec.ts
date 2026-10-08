import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of } from 'rxjs';
import { FormTemplateComponent } from './form-template.component';
import { FormFieldConfig } from '../../forms/form-field.model';

describe('FormTemplateComponent', () => {
  let component: FormTemplateComponent;
  let fixture: ComponentFixture<FormTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormTemplateComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(FormTemplateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build a form group from the field config', () => {
    const fields: FormFieldConfig[] = [
      { name: 'name', label: 'Nombre', type: 'text', show: true, required: true, weight: 1 },
      { name: 'active', label: 'Activo', type: 'checkbox', show: true, value: false, weight: 2 },
    ];
    fixture.componentRef.setInput('form', fields);
    fixture.detectChanges();

    expect(component.formGroup.get('name')).toBeTruthy();
    expect(component.formGroup.get('name')?.value).toBe('');
    expect(component.formGroup.get('name')?.hasError('required')).toBe(true);
    expect(component.formGroup.get('active')?.value).toBe(false);
  });

  it('should sort fields by weight and skip hidden ones', () => {
    const fields: FormFieldConfig[] = [
      { name: 'hidden', label: 'H', type: 'text', show: false, weight: 1 },
      { name: 'a', label: 'A', type: 'text', show: true, weight: 2 },
    ];
    fixture.componentRef.setInput('form', fields);
    fixture.detectChanges();

    expect(component.formGroup.get('hidden')).toBeNull();
    expect(component.formGroup.get('a')).toBeTruthy();
  });

  it('should render every supported field type', () => {
    const fields: FormFieldConfig[] = [
      { name: 'txt', label: 'T', type: 'text', show: true, weight: 1, pKeyFilter: 'alpha', maxLength: '10', minLength: '2', required: true },
      { name: 'em', label: 'E', type: 'email', show: true, weight: 2, pattern: /^[a-z]+@[a-z]+$/ },
      { name: 'pw', label: 'P', type: 'password', show: true, weight: 3, feedback: true },
      { name: 'ta', label: 'A', type: 'textarea', show: true, weight: 4, required: true },
      { name: 'mk', label: 'M', type: 'mask', show: true, weight: 5, mask: '(99) 999-9999', slotChar: '_' },
      { name: 'sel', label: 'S', type: 'select', show: true, weight: 6, options: [{ name: 'A', value: 1 }], optionName: 'name', optionValue: 'value' },
      { name: 'cb', label: 'C', type: 'checkbox', show: true, weight: 7 },
      { name: 'col', label: 'Co', type: 'colorpicker', show: true, weight: 8 },
      { name: 'dp', label: 'D', type: 'datepicker', show: true, weight: 9, dateFormat: 'dd/mm/yy' },
      { name: 'tm', label: 'T2', type: 'timeonly', show: true, weight: 10 },
      { name: 'ms', label: 'Ms', type: 'multiselect', show: true, weight: 11, options: [{ name: 'X', value: 1 }], optionName: 'name' },
    ];
    fixture.componentRef.setInput('form', fields);
    expect(() => fixture.detectChanges()).not.toThrow();

    ['txt', 'em', 'pw', 'ta', 'mk', 'sel', 'cb', 'col', 'dp', 'tm', 'ms'].forEach(
      (name) => expect(component.formGroup.get(name)).toBeTruthy(),
    );
  });

  it('should apply the password match validator', () => {
    const fields: FormFieldConfig[] = [
      { name: 'currentPassword', label: 'Actual', type: 'password', show: true, weight: 1 },
      { name: 'newPassword', label: 'Nueva', type: 'password', show: true, weight: 2 },
      { name: 'confirmPassword', label: 'Confirmar', type: 'password', show: true, weight: 3 },
    ];
    fixture.componentRef.setInput('form', fields);
    fixture.detectChanges();

    component.formGroup.setValue({
      currentPassword: 'old',
      newPassword: '1234',
      confirmPassword: '9999',
    });

    expect(component.passwordMismatch).toBe(true);
    expect(component.passwordMismatchMessage()).toContain('no coinciden');
  });

  it('should enable/disable fields controlled by a checkbox', () => {
    const fields: FormFieldConfig[] = [
      { name: 'active', label: 'Activo', type: 'checkbox', show: true, value: false, weight: 1, controls: ['detail'] },
      { name: 'detail', label: 'Detalle', type: 'text', show: true, weight: 2 },
    ];
    fixture.componentRef.setInput('form', fields);
    fixture.detectChanges();

    expect(component.formGroup.get('detail')?.disabled).toBe(true);

    component.formGroup.get('active')?.setValue(true);
    expect(component.formGroup.get('detail')?.enabled).toBe(true);
  });

  it('should handle dependsOn with a disabled condition', () => {
    const fields: FormFieldConfig[] = [
      { name: 'kind', label: 'Tipo', type: 'text', show: true, weight: 1 },
      {
        name: 'extra',
        label: 'Extra',
        type: 'text',
        show: true,
        weight: 2,
        dependsOn: 'kind',
        disabledCondition: (group: any) => group.get('kind')?.value !== 'full',
      },
    ];
    fixture.componentRef.setInput('form', fields);
    fixture.detectChanges();

    expect(component.formGroup.get('extra')?.disabled).toBe(true);

    component.formGroup.get('kind')?.setValue('full');
    expect(component.formGroup.get('extra')?.enabled).toBe(true);
  });

  it('should provide a multiselect label', () => {
    fixture.componentRef.setInput('form', [
      { name: 'ms', label: 'Ms', type: 'multiselect', show: true, options: [{ name: 'A' }, { name: 'B' }, { name: 'C' }], optionName: 'name' },
    ] as FormFieldConfig[]);
    fixture.detectChanges();

    expect(component.getMultiSelectLabel('ms')).toBe('Ningún ítem seleccionado');

    component.formGroup.get('ms')?.setValue([{ name: 'A' }]);
    expect(component.getMultiSelectLabel('ms')).toBe('A');

    component.formGroup.get('ms')?.setValue([{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }]);
    expect(component.getMultiSelectLabel('ms')).toBe('Has seleccionado 4 items');
  });

  it('should compare objects by name', () => {
    expect(component.compareObjects({ name: 'a' }, { name: 'a' })).toBe(true);
    expect(component.compareObjects({ name: 'a' }, { name: 'b' })).toBe(false);
    expect(component.compareObjects(null, null)).toBe(true);
  });

  it('should build the multiselect label from alternative fields', () => {
    fixture.componentRef.setInput('form', [
      { name: 'ms', label: 'Ms', type: 'multiselect', show: true, options: [{ name: 'A' }], optionName: 'name' },
    ] as FormFieldConfig[]);
    fixture.detectChanges();

    component.formGroup.get('ms')?.setValue([{ nombre: 'X' }]);
    expect(component.getMultiSelectLabel('ms')).toBe('X');

    component.formGroup.get('ms')?.setValue(['plain']);
    expect(component.getMultiSelectLabel('ms')).toBe('plain');
  });

  it('should patch initial data on changes', () => {
    fixture.componentRef.setInput('form', [
      { name: 'name', label: 'Nombre', type: 'text', show: true, weight: 1 },
    ] as FormFieldConfig[]);
    fixture.detectChanges();

    fixture.componentRef.setInput('initialData', { name: 'John' });
    fixture.detectChanges();

    expect(component.formGroup.get('name')?.value).toBe('John');
  });

  it('should reset the form and state', () => {
    fixture.componentRef.setInput('form', [
      { name: 'name', label: 'Nombre', type: 'text', show: true, weight: 1 },
    ] as FormFieldConfig[]);
    fixture.detectChanges();

    component.formGroup.patchValue({ name: 'X' });
    component.reset();

    expect(component.formGroup.get('name')?.value).toBeFalsy();
  });

  it('deshabilita los campos disabledOnEdit solo en edición', () => {
    fixture.componentRef.setInput('form', [
      { name: 'name', label: 'Nombre', type: 'text', show: true, weight: 1, disabledOnEdit: true },
      { name: 'email', label: 'Email', type: 'text', show: true, weight: 2 },
    ] as FormFieldConfig[]);
    fixture.componentRef.setInput('isEdit', true);
    fixture.detectChanges();

    expect(component.formGroup.get('name')?.disabled).toBe(true);
    expect(component.formGroup.get('email')?.enabled).toBe(true);

    fixture.componentRef.setInput('isEdit', false);
    fixture.detectChanges();

    expect(component.formGroup.get('name')?.enabled).toBe(true);
  });

  it('verifica disponibilidad de campos checkable (búsqueda manual)', () => {
    const checker = jasmine
      .createSpy('checkAvailability')
      .and.returnValue(of(true));
    fixture.componentRef.setInput('form', [
      { name: 'name', label: 'Nombre', type: 'text', show: true, weight: 1, checkable: true },
    ] as FormFieldConfig[]);
    fixture.componentRef.setInput('checkAvailability', checker);
    fixture.componentRef.setInput('checkMessages', {
      name: { taken: 'Ya existe', available: 'Disponible' },
    });
    fixture.detectChanges();

    component.formGroup.get('name')?.setValue('EmpresaX');
    component.checkFieldNow('name');

    expect(checker).toHaveBeenCalledWith('name', 'EmpresaX');
    expect(component.availability['name'].status).toBe('taken');
    expect(component.availability['name'].message).toBe('Ya existe');
  });
});

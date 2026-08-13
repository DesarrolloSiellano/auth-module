import { FormGroup, FormControl } from '@angular/forms';
import {
  FormValidationUtils,
  passwordMatchValidator,
  getNoSpace,
} from './validations-message';

describe('FormValidationUtils', () => {
  it('should return required message', () => {
    const control = new FormControl('');
    control.setValidators((c) => (c.value ? null : { required: true }));
    control.updateValueAndValidity();
    expect(FormValidationUtils.getErrorMessage(control, 'Nombre')).toBe(
      'Campo Nombre obligatorio',
    );
  });

  it('should return maxlength message', () => {
    const control = new FormControl('1234567890');
    control.setValidators((c) =>
      c.value.length > 5 ? { maxlength: { requiredLength: 5 } } : null,
    );
    control.updateValueAndValidity();
    expect(FormValidationUtils.getErrorMessage(control)).toBe(
      'Máximo permitido 5 car.',
    );
  });

  it('should return minlength message', () => {
    const control = new FormControl('ab');
    control.setValidators((c) =>
      c.value.length < 3 ? { minlength: { requiredLength: 3 } } : null,
    );
    control.updateValueAndValidity();
    expect(FormValidationUtils.getErrorMessage(control)).toBe(
      'Minimo permitido 3 car.',
    );
  });

  it('should return pattern message', () => {
    const control = new FormControl('abc');
    control.setValidators(() => ({ pattern: true }));
    control.updateValueAndValidity();
    expect(FormValidationUtils.getErrorMessage(control)).toBe(
      'El formato no es válido',
    );
  });

  it('should return null when valid', () => {
    const control = new FormControl('ok');
    expect(FormValidationUtils.getErrorMessage(control)).toBeNull();
  });
});

describe('passwordMatchValidator', () => {
  it('should return error when passwords differ', () => {
    const group = new FormGroup({
      password: new FormControl('1234'),
      confirmPassword: new FormControl('5678'),
    });
    const result = passwordMatchValidator('password', 'confirmPassword')(group);
    expect(result).toEqual({ passwordMismatch: true });
  });

  it('should return null when passwords match', () => {
    const group = new FormGroup({
      password: new FormControl('1234'),
      confirmPassword: new FormControl('1234'),
    });
    expect(passwordMatchValidator('password', 'confirmPassword')(group)).toBeNull();
  });

  it('should return null when a control is missing', () => {
    const group = new FormGroup({
      password: new FormControl('1234'),
    });
    expect(
      passwordMatchValidator('password', 'confirmPassword')(group),
    ).toBeNull();
  });
});

describe('getNoSpace', () => {
  it('should flag an all-whitespace value', () => {
    const control = new FormControl('   ');
    expect(getNoSpace(control)).toEqual({ noSpace: true });
  });

  it('should return null for a value with content', () => {
    const control = new FormControl('abc');
    expect(getNoSpace(control)).toBeNull();
  });

  it('should return null for an empty value', () => {
    const control = new FormControl('');
    expect(getNoSpace(control)).toBeNull();
  });
});

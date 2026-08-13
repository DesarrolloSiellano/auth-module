import { FormFieldConfig, FormFieldType } from './form-field.model';
import { LOGIN_FORM, RECOVERY_FORM } from './login.form';
import { ROLES_FORM } from './roles.form';
import { PERMISSION_FORM } from './permission.form';
import { COMPANIES_FORM } from './companies.form';
import { MODULE_FORM } from './module.form';
import { CHANGE_PASSWORD_FORM } from './change-password.form';

const VALID_TYPES: FormFieldType[] = [
  'text',
  'email',
  'password',
  'textarea',
  'mask',
  'select',
  'checkbox',
  'colorpicker',
  'datepicker',
  'timeonly',
  'multiselect',
];

describe('Form configs', () => {
  const configs: { name: string; form: FormFieldConfig[] }[] = [
    { name: 'LOGIN_FORM', form: LOGIN_FORM },
    { name: 'RECOVERY_FORM', form: RECOVERY_FORM },
    { name: 'ROLES_FORM', form: ROLES_FORM },
    { name: 'PERMISSION_FORM', form: PERMISSION_FORM },
    { name: 'COMPANIES_FORM', form: COMPANIES_FORM },
    { name: 'MODULE_FORM', form: MODULE_FORM },
    { name: 'CHANGE_PASSWORD_FORM', form: CHANGE_PASSWORD_FORM },
  ];

  configs.forEach(({ name, form }) => {
    describe(name, () => {
      it('should be a non-empty array', () => {
        expect(Array.isArray(form)).toBe(true);
        expect(form.length).toBeGreaterThan(0);
      });

      it('should have unique field names', () => {
        const names = form.map((f) => f.name);
        expect(new Set(names).size).toBe(names.length);
      });

      it('should define name, label and a valid type on every field', () => {
        form.forEach((field) => {
          expect(field.name).toBeTruthy();
          expect(field.label).toBeTruthy();
          expect(VALID_TYPES).toContain(field.type);
        });
      });
    });
  });

  it('should have a login form with email and password fields', () => {
    const names = LOGIN_FORM.map((f) => f.name);
    expect(names).toContain('email');
    expect(names).toContain('password');
  });

  it('should include password fields in the change password form', () => {
    const names = CHANGE_PASSWORD_FORM.map((f) => f.name);
    expect(names).toContain('currentPassword');
    expect(names).toContain('newPassword');
    expect(names).toContain('confirmPassword');
  });
});

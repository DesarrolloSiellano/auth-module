import { FormGroup, ValidatorFn } from '@angular/forms';
import { KeyFilterPattern } from 'primeng/keyfilter';

export type FormFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'textarea'
  | 'mask'
  | 'select'
  | 'checkbox'
  | 'colorpicker'
  | 'datepicker'
  | 'timeonly'
  | 'multiselect';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: FormFieldType;
  show?: boolean;
  required?: boolean;
  value?: unknown;
  maxLength?: string;
  minLength?: string;
  weight?: number;
  disabled?: boolean;
  /** Si es `true`, el campo se deshabilita en modo edición (no editable). */
  disabledOnEdit?: boolean;
  placeholder?: string;
  pKeyFilter?: RegExp | KeyFilterPattern;
  pattern?: string | RegExp;
  feedback?: boolean;
  options?: unknown[];
  optionName?: string;
  optionValue?: string;
  dependsOn?: string;
  disabledCondition?: (formGroup: FormGroup) => boolean;
  controls?: string[];
  extraValidators?: ValidatorFn[];
  mask?: string;
  slotChar?: string;
  dateFormat?: string;
  selectionMode?: string;
  minDate?: Date;
  maxDate?: Date;
}

import { ValidatorFn } from '@angular/forms';

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
  value?: any;
  maxLength?: string;
  minLength?: string;
  weight?: number;
  disabled?: boolean;
  placeholder?: string;
  pKeyFilter?: any;
  pattern?: string | RegExp;
  feedback?: boolean;
  options?: any[];
  optionName?: string;
  optionValue?: string;
  dependsOn?: string;
  disabledCondition?: (formGroup: any) => boolean;
  controls?: string[];
  extraValidators?: ValidatorFn[];
  mask?: string;
  slotChar?: string;
  dateFormat?: string;
  selectionMode?: string;
  minDate?: Date;
  maxDate?: Date;
}

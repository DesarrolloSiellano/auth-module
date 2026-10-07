import {
  Component,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { KeyFilterModule } from 'primeng/keyfilter';
import { TextareaModule } from 'primeng/textarea';
import { InputMaskModule } from 'primeng/inputmask';
import { filterAndSort } from './helpers/filterAndSort';
import {
  FormValidationUtils,
  passwordMatchValidator,
} from '../../validations/validations-message';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { FloatLabelModule } from 'primeng/floatlabel';

import { ColorPickerModule } from 'primeng/colorpicker';
import { Subscription } from 'rxjs';
import { FormFieldConfig } from '../../forms/form-field.model';

@Component({
  selector: 'app-form-template',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    DatePickerModule,
    PasswordModule,
    InputMaskModule,
    KeyFilterModule,
    DividerModule,
    TextareaModule,
    SelectModule,
    CheckboxModule,
    MultiSelectModule,
    ColorPickerModule,
    FloatLabelModule,
  ],
  templateUrl: './form-template.component.html',
  styleUrl: './form-template.component.scss',
})
export class FormTemplateComponent implements OnInit, OnDestroy {
  readonly isVisible = input<boolean>(false);
  readonly form = input<FormFieldConfig[]>([]);
  readonly formValidations = input<unknown>();
  readonly initialData = input<unknown>();
  readonly id = input<string>('');
  readonly titleForm = input<string>('');
  readonly width = input<string>('30rem');
  readonly isEdit = input<boolean>(false);
  readonly title = input<string>('');
  readonly colClass = input<string>('col-lg-4 col-md-6 col-sm-12');
  readonly submitButtonText = input<string>('Guardar');
  readonly cancelButtonText = input<string>('Cancelar');
  readonly submitForm = input<() => void>();
  readonly cancelForm = input<() => void>();

  formGroup!: FormGroup;
  fields: FormFieldConfig[] = [];
  private subscriptions = new Subscription();
  private readonly formBuilder = inject(FormBuilder);

  constructor() {
    effect(() => {
      const data = this.initialData();
      const isEdit = this.isEdit();
      if (!this.formGroup) return;
      if (data) {
        this.formGroup.patchValue(data as object);
        this.updateFieldStateDisabled();
        this.updateFieldStatesDisabledByDepends();
      }
      this.applyDisabledOnEdit(isEdit);
    });
  }

  ngOnInit() {
    this.fields = filterAndSort(this.form());

    this.formGroup = this.formBuilder.group(
      this.fields.reduce<Record<string, unknown>>((group, item) => {
        const isCheckbox = item.type === 'checkbox'; // Verificar si es un checkbox

        group[item.name] = [
          isCheckbox ? item.value || false : item.value || '', // Valor por defecto para checkbox
          [
            item.required ? Validators.required : null,
            item.maxLength ? Validators.maxLength(+item.maxLength) : null,
            item.minLength ? Validators.minLength(+item.minLength) : null,
            item.pattern ? Validators.pattern(item.pattern) : null,
            ...(item.extraValidators || []),
          ].filter(Boolean),
        ];
        return group;
      }, {})
    );

    if (
      this.formGroup.get('currentPassword') &&
      this.formGroup.get('newPassword')
    ) {
      this.formGroup.setValidators(
        passwordMatchValidator('newPassword', 'confirmPassword')
      );
    }

    // Suscríbete a los valueChanges para revalidar cuando cambie:
    this.subscriptions.add(
      this.formGroup.get('confirmPassword')?.valueChanges.subscribe(() => {
        this.formGroup.updateValueAndValidity({
          onlySelf: true,
          emitEvent: false,
        });
      }),
    );

    this.subscriptions.add(
      this.formGroup.get('newPassword')?.valueChanges.subscribe(() => {
        this.formGroup.updateValueAndValidity({
          onlySelf: true,
          emitEvent: false,
        });
      }),
    );

    this.fields.forEach((item) => {
      if (item.dependsOn) {
        this.subscriptions.add(
          this.formGroup.get(item.dependsOn)?.valueChanges.subscribe(() => {
            this.updateFieldStatesDisabledByDepends();
          }),
        );
      }

      if (
        item.type === 'checkbox' &&
        item.controls &&
        Array.isArray(item.controls)
      ) {
        this.subscriptions.add(
          this.formGroup.get(item.name)?.valueChanges.subscribe((value) => {
            this.updateFieldStateDisabled();
          }),
        );
      }
    });
    this.updateFieldStatesDisabledByDepends();
    this.updateFieldStateDisabled();
    this.applyDisabledOnEdit();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /** Deshabilita en edición los campos marcados como `disabledOnEdit`. */
  private applyDisabledOnEdit(isEdit = this.isEdit()): void {
    if (!this.formGroup) return;
    this.fields.forEach((item) => {
      if (!item.disabledOnEdit) return;
      const control = this.formGroup.get(item.name);
      if (!control) return;
      if (isEdit) {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    });
  }

  get passwordMismatch(): boolean {
    return !!this.formGroup.errors?.['passwordMismatch'];
  }

  passwordMismatchMessage(): string {
    return FormValidationUtils.passwordMismatchMessage();
  }

  compareObjects(o1: unknown, o2: unknown): boolean {
    const a = o1 as { name?: unknown } | null | undefined;
    const b = o2 as { name?: unknown } | null | undefined;
    return a && b ? a.name === b.name : o1 === o2;
  }

  updateFieldStatesDisabledByDepends(): void {
    this.fields.forEach((item) => {
      if (item.dependsOn && item.disabledCondition) {
        const control = this.formGroup.get(item.name);
        const shouldDisable = item.disabledCondition(this.formGroup);

        if (shouldDisable) {
          control?.disable();
          control?.clearValidators();
        } else {
          control?.enable();
          control?.setValidators([Validators.required]);
        }
        control?.updateValueAndValidity();
      }
    });
  }

  updateFieldStateDisabled(): void {
    this.fields.forEach((item) => {
      if (
        item.type === 'checkbox' &&
        item.controls &&
        Array.isArray(item.controls)
      ) {
        const checkboxControl = this.formGroup.get(item.name);
        if (checkboxControl) {
          const checkboxValue = checkboxControl.value;
          item.controls.forEach((controlName: string) => {
            const control = this.formGroup.get(controlName);
            if (control) {
              if (checkboxValue) {
                control.enable();
                control.setValidators([Validators.required]);
              } else {
                control.disable();
                control.clearValidators();
              }
              control.updateValueAndValidity();
            }
          });
        }
      }
    });
  }

  getMultiSelectLabel(controlName: string): string {
    const selectedValues = this.formGroup.get(controlName)?.value || [];
    if (selectedValues.length === 0) {
      return 'Ningún ítem seleccionado';
    } else if (selectedValues.length <= 3) {
      return selectedValues
        .map(
          (item: Record<string, unknown>) =>
            item['name'] || item['nombre'] || item,
        )
        .join(', ');
    } else {
      return `Has seleccionado ${selectedValues.length} items`;
    }
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.formGroup.get(controlName);
    return control ? FormValidationUtils.getErrorMessage(control) : null;
  }

  reset(): void {
    this.formGroup.reset();
  }
}

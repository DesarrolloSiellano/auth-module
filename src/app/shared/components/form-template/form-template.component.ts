import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
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
import { FormValidationUtils } from '../../validations/validations-message';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { FloatLabelModule } from 'primeng/floatlabel';

import { ColorPickerModule } from 'primeng/colorpicker';

FormValidationUtils;

@Component({
  selector: 'app-form-template',
  standalone: true,
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
    FloatLabelModule
  ],
  templateUrl: './form-template.component.html',
  styleUrl: './form-template.component.scss',
})
export class FormTemplateComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() form: any[] = [];
  @Input() formValidations: any;
  @Input() initialData: any;
  @Input() id: string = '';
  @Input() titleForm: string = '';
  @Input() width: string = '30rem';
  @Input() isEdit: boolean = false;
  @Input() title: string = '';
  @Input() colClass: string = 'col-lg-4 col-md-6 col-sm-12';
  @Input() submitButtonText: string = 'Guardar';
  @Input() cancelButtonText: string = 'Cancelar';
  @Input() submitForm!: Function;
  @Input() cancelForm!: Function;

  formGroup!: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.form = filterAndSort(this.form);
    this.formGroup = this.formBuilder.group(
      this.form.reduce((group, item) => {
        const isCheckbox = item.type === 'checkbox'; // Verificar si es un checkbox

        group[item.name] = [
          isCheckbox ? item.value || false : item.value || '', // Valor por defecto para checkbox
          [
            item.required ? Validators.required : null,
            item.maxLength ? Validators.maxLength(+item.maxLength) : null,
            item.minLength ? Validators.minLength(+item.minLength) : null,
            item.pattern ? Validators.pattern(item.pattern) : null,
          ].filter(Boolean),
        ];
        return group;
      }, {})
    );



    this.form.forEach((item) => {
      if (item.dependsOn) {
        this.formGroup.get(item.dependsOn)?.valueChanges.subscribe(() => {
          this.updateFieldStatesDisabledByDepends();
        });
      }

      if (item.type === 'checkbox' && item.controls && Array.isArray(item.controls)) {
        this.formGroup.get(item.name)?.valueChanges.subscribe(value => {
          this.updateFieldStateDisabled();
        });
      }
    });
    this.updateFieldStatesDisabledByDepends();
    this.updateFieldStateDisabled();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && changes['initialData'].currentValue) {
      this.formGroup.patchValue(changes['initialData'].currentValue);
      this.updateFieldStateDisabled();
      this.updateFieldStatesDisabledByDepends();
    }


  }

  updateFieldStatesDisabledByDepends(): void {
    this.form.forEach((item) => {
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
     this.form.forEach((item) => {
      if (item.type === 'checkbox' && item.controls && Array.isArray(item.controls)) {
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
      return selectedValues.map((item: any) => item.nombre || item).join(', ');
    } else {
      return `Has seleccionado ${selectedValues.length} items`;
    }
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.formGroup.get(controlName);
    return control ? FormValidationUtils.getErrorMessage(control) : null;
  }


  reset(): void {
    this.isEdit = false;
    this.formGroup.reset();
    this.initialData = null;
    this.title = '';
  }
}

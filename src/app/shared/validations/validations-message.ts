import { AbstractControl, ValidationErrors } from '@angular/forms';

export class FormValidationUtils {
  static getErrorMessage(
    control: AbstractControl,
    controlName: string = ''
  ): string | null {
    if (control.hasError('required')) {
      return `Campo ${controlName} obligatorio`;
    }
    if (control.hasError('maxlength')) {
      return `Máximo permitido ${
        control.getError('maxlength').requiredLength
      } car.`;
    }
    if (control.hasError('minlength')) {
      return `Minimo permitido ${
        control.getError('minlength').requiredLength
      } car.`;
    }
    if (control.hasError('pattern')) {
      return 'El formato no es válido';
    }
    return null;
  }

}

export function getNoSpace(control: AbstractControl): ValidationErrors | null {
  if (control.value && control.value.trim().length === 0) {
    return { noSpace: true };
  }
  return null;
}

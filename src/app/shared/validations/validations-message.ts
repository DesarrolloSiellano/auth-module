import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

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

  static passwordMismatchMessage(): string {
    return 'Las contraseñas no coinciden';
  }

}

export function passwordMatchValidator(passwordField: string, confirmPasswordField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordField);
    const confirmPassword = group.get(confirmPasswordField);

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  };
}


export function getNoSpace(control: AbstractControl): ValidationErrors | null {
  if (control.value && control.value.trim().length === 0) {
    return { noSpace: true };
  }
  return null;
}

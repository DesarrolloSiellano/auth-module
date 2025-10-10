export const LOGIN_FORM = [
  {
    name: 'email',
    label: 'Correo Electronico',
    type: 'text',
    show: true,
    required: true,
    value: '',
    maxLength: '150',
    minLength: '3',
    weight: 1,
    disabled: false,
    placeholder: '',
    pKeyFilter: '',
    pattern: /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/,

  },
  {
    name: 'password',
    label: 'Contraseña',
    type: 'password',
    show: true,
    required: true,
    value: '',
    maxLength: '20',
    minLength: '4',
    feedback: false,
    weight: 1,
    disabled: false,
    placeholder: '',
    pKeyFilter: '',
    //pattern: /^[a-zA-ZáéíóúÁÉÍÓÜñÜ\s]+$/,
  },
];


export const RECOVERY_FORM = [
  {
    name: 'email',
    label: 'Correo Electronico',
    type: 'text',
    show: true,
    required: true,
    value: '',
    maxLength: '150',
    minLength: '3',
    weight: 1,
    disabled: false,
    placeholder: '',
    pKeyFilter: '',
    pattern: /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/,
  },
];

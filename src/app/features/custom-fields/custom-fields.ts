import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { Tag } from 'primeng/tag';

import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { UserService } from '../users/services/user';
import { CustomFieldDefinition } from '../users/interfaces/user.interface';

@Component({
  selector: 'app-custom-fields',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    Button,
    InputText,
    Select,
    Checkbox,
    Dialog,
    Tag,
  ],
  templateUrl: './custom-fields.html',
  styleUrl: './custom-fields.scss',
})
export class CustomFieldsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly confirmService = inject(ConfirmService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  fields: CustomFieldDefinition[] = [];
  loading = false;
  saving = false;
  processing = false;
  dialogVisible = false;
  editing = false;
  editingId: string | null = null;
  company = localStorage.getItem('company') || '';
  companyFilter = localStorage.getItem('company') || '';

  typeOptions = [
    { label: 'Texto', value: 'text' },
    { label: 'Número', value: 'number' },
    { label: 'Fecha', value: 'date' },
    { label: 'Selección', value: 'select' },
    { label: 'Booleano', value: 'boolean' },
  ];

  form = this.fb.group({
    key: ['', Validators.required],
    label: ['', Validators.required],
    type: ['text', Validators.required],
    required: [false],
    order: [0],
    isActive: [true],
    optionsText: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.userService
      .listCustomFields(this.companyFilter || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (res) => {
        this.fields = res.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openCreate(): void {
    this.editing = false;
    this.editingId = null;
    this.form.reset({
      key: '',
      label: '',
      type: 'text',
      required: false,
      order: this.fields.length,
      isActive: true,
      optionsText: '',
    });
    this.dialogVisible = true;
  }

  openEdit(field: CustomFieldDefinition): void {
    this.editing = true;
    this.editingId = field._id;
    this.form.reset({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      order: field.order,
      isActive: field.isActive,
      optionsText: (field.options || [])
        .map((o) => `${o.label}:${o.value}`)
        .join(', '),
    });
    this.dialogVisible = true;
  }

  save(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const value = this.form.value;
    const options =
      value.type === 'select'
        ? String(value.optionsText || '')
            .split(',')
            .map((pair) => pair.trim())
            .filter(Boolean)
            .map((pair) => {
              const [label, val] = pair.split(':');
              return { label: (label || '').trim(), value: (val || label || '').trim() };
            })
        : [];

    const body: Partial<CustomFieldDefinition> = {
      key: value.key || '',
      label: value.label || '',
      type: value.type as CustomFieldDefinition['type'],
      required: value.required === true,
      order: Number(value.order) || 0,
      isActive: value.isActive !== false,
      options,
    };
    const targetCompany = this.companyFilter || this.company;
    if (targetCompany) {
      (body as any).company = targetCompany;
    }

    const request$ =
      this.editing && this.editingId
        ? this.userService.updateCustomField(this.editingId, body)
        : this.userService.createCustomField(body);

    request$.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.dialogVisible = false;
        this.confirmService.showMessage('success', 'Campos', 'Campo guardado');
        this.load();
      },
      error: (err: any) =>
        this.confirmService.showMessage(
          'error',
          'Campos',
          err?.error?.message || 'No se pudo guardar el campo',
        ),
    });
  }

  async remove(field: CustomFieldDefinition): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    const ok = await this.confirmService.confirm(
      field.label,
      'Eliminar campo',
      '¿Eliminar el campo',
      'pi pi-exclamation-triangle',
      'Cancelar',
      'Eliminar',
      'secondary',
      'danger',
    );
    if (!ok) {
      this.processing = false;
      return;
    }
    this.userService
      .deleteCustomField(field._id)
      .pipe(finalize(() => (this.processing = false)))
      .subscribe({
        next: () => {
          this.confirmService.showMessage('success', 'Campos', 'Campo eliminado');
          this.load();
        },
        error: () =>
          this.confirmService.showMessage(
            'error',
            'Campos',
            'No se pudo eliminar el campo',
          ),
      });
  }
}

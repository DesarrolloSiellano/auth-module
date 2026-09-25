import { ChangeDetectorRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TableLazyLoadEvent } from 'primeng/table';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';
import moment from 'moment';

import { DataLoaderService } from '../services/data-load.service';
import { ConfirmService } from '../services/confirm-dialog.service';
import { ExcelExportService } from '../services/excel-export.service';
import { FormFieldConfig } from '../forms/form-field.model';

export interface IBaseService<T> {
  findAll(): Observable<unknown>;
  findById(id: string): Observable<unknown>;
  findByPage(
    from?: number,
    limit?: number,
    global?: string,
    filters?: string,
  ): Observable<unknown>;
  findByDate?(startDate?: string, endDate?: string): Observable<unknown>;
  create(item: T): Observable<unknown>;
  update(id: string, item: T): Observable<unknown>;
  delete(id: string): Observable<unknown>;
}

export interface Identifiable {
  _id?: string;
  name?: string;
}

export abstract class BaseCrud<T extends Identifiable> {
  data: T[] = [];
  totalRecords = 0;
  loading = false;
  filtersGlobal = true;

  isFormVisible = false;
  isDisplayForm = false;
  isEditForm = false;
  titleForm: string = '';
  initialData!: T;
  title: string = '';
  subtitle: string = '';

  toAdd: boolean = true;
  options: boolean = false;

  selected?: T;
  items: MenuItem[] = [];
  filterExcel: T[] = [];
  isSearchPopulation: boolean = false;
  protected form: FormFieldConfig[] = [];
  protected formComponent?: { formGroup: FormGroup; reset: () => void };
  disabledButton: boolean = false;

  constructor(
    protected service: IBaseService<T>,
    protected cdr: ChangeDetectorRef,
    protected dataLoader: DataLoaderService,
    protected excelexport: ExcelExportService,
    protected confirmService: ConfirmService,
  ) {}

  load(event?: TableLazyLoadEvent) {
    this.loading = true;
    this.dataLoader
      .loadData(this.service.findByPage.bind(this.service), event ?? {})
      .subscribe((response: unknown) => {
        const result = this.dataLoader.handleResponse<T>(response);
        if (result.ok) {
          this.totalRecords = result.totalResults ?? 0;
          this.data = result.data ?? [];
          this.loading = false;
        } else {
          this.loading = false;
        }
      });
    this.cdr.detectChanges();
  }

  create() {
    this.titleForm = 'Creación de ' + this.subtitle;
    this.isFormVisible = true;
    this.isDisplayForm = true;
    this.isEditForm = false;
  }

  update(selected: T) {
    this.onSelectionChange(selected);
  }

  async delete(selected: T) {
    // Evita disparar dos veces (doble clic / doble confirmación).
    if (this.disabledButton) return;
    this.disabledButton = true;

    const isConfirm = await this.confirmService.confirm(
      selected.name ?? '',
      `Eliminación de ${this.title}`,
      'Estas seguro de eliminar el registro',
      'pi pi-exclamation-triangle',
      'Cancelar',
      'Aceptar',
      'secondary',
    );

    if (!isConfirm) {
      this.confirmService.showMessage(
        'error',
        'Cancelado',
        `El ${this.subtitle} no se ha eliminado correctamente`,
      );
      this.disabledButton = false;
      return;
    }

    this.service
      .delete(selected._id ?? '')
      .pipe(finalize(() => (this.disabledButton = false)))
      .subscribe({
        next: (response: unknown) => {
          const status = (response as { statusCode?: number } | null)?.statusCode;
          if (status === 200 || status === 201 || status === 204) {
            this.confirmService.showMessage(
              'success',
              'Eliminación',
              `El ${this.subtitle} se ha eliminado correctamente`,
            );
          }
        },
        error: (err: unknown) => {
          console.error(err);
        },
        complete: () => this.rechargeTable(),
      });
  }

  save() {
    // Evita reenvíos mientras hay una petición en curso.
    if (this.disabledButton) return;

    this.disabledButton = true;
    let id = '';
    if (this.isEditForm) id = this.initialData?._id ?? '';

    const formValues = this.getFormattedFormValues();
    const request$ = this.isEditForm
      ? this.service.update(id, formValues)
      : this.service.create(formValues);

    request$.subscribe({
      next: (response: unknown) => {
        const status = (response as { statusCode?: number } | null)?.statusCode;
        if (status === 200 || status === 201) {
          this.closeDialog();
          this.confirmService.showMessage(
            'info',
            this.isEditForm ? 'Edición' : 'Creación',
            `El ${this.subtitle} se ha ` +
              (this.isEditForm ? 'editado' : 'creado') +
              ' correctamente',
          );
          this.rechargeTable();
        } else {
          this.disabledButton = false;
        }
      },
      error: (err: unknown) => {
        // El error se notifica de forma global vía el errorInterceptor
        console.error(err);
        this.disabledButton = false;
      },
    });
  }

  recharge(): void {
    this.rechargeTable();
  }

  rechargeTable(): void {
    this.loading = true;
    this.dataLoader
      .loadData(this.service.findByPage.bind(this.service), {
        first: 0,
        rows: 100,
        globalFilter: '',
        filters: {},
      })
      .subscribe((response: unknown) => {
        const result = this.dataLoader.handleResponse<T>(response);
        if (result.ok) {
          this.totalRecords = result.totalResults ?? 0;
          this.data = result.data ?? [];
          this.loading = false;
        } else {
          this.loading = false;
        }
      });
    this.cdr.detectChanges();
  }

  queryDate(event: { initial?: Date | null; final?: Date | null }): void {
    this.loading = true;
    this.filtersGlobal = false;

    const request$ = this.service.findByDate?.(
      moment(event.initial ?? undefined).format('YYYY-MM-DD'),
      moment(event.final ?? undefined).format('YYYY-MM-DD'),
    );

    if (!request$) {
      this.loading = false;
      return;
    }

    request$.subscribe((response: unknown) => {
      const result = this.dataLoader.handleResponse<T>(response);
      if (result.ok) {
        this.totalRecords = result.totalResults ?? 0;
        this.data = result.data ?? [];
        this.loading = false;
      } else {
        this.loading = false;
      }
    });
  }

  exportAsXLSX(): void {
    this.excelexport.exportAsExcelFile(this.data, 'totalLeaders');
  }

  onSelectionChange(selectedItem: T) {
    if (selectedItem) {
      this.isEditForm = true;
      this.titleForm = 'Edición de ' + this.subtitle;
      this.isFormVisible = true;
      this.isDisplayForm = true;

      this.initialData = {
        ...this.initialData,
        ...selectedItem,
      };
    }
  }

  getFormattedFormValues(): T {
    return (this.formComponent?.formGroup?.value ?? {}) as T;
  }

  closeDialog() {
    this.isDisplayForm = false;
    this.isFormVisible = false;
    this.formComponent?.reset();
    this.disabledButton = false;
  }
}

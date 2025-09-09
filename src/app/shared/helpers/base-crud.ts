import { ChangeDetectorRef } from '@angular/core';
import { TableLazyLoadEvent } from 'primeng/table';
import { DataLoaderService } from '../services/data-load.service';

import { ConfirmService } from '../services/confirm-dialog.service';
import { ExcelExportService } from '../services/excel-export.service';
import { MenuItem } from 'primeng/api';
import moment from 'moment';

export interface IBaseService<T> {
  findAll(): any;
  findById(id: any): any;
  findByPage(...args: any[]): any; // Observable esperado
  findByDate(...args: any[]): any; // Opcional
  create(item: T): any;
  update(id: any, item: T): any;
  delete(id: any): any;
}

export abstract class BaseCrud<T> {
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

  toAdd: boolean = true;
  options: boolean = false;

  selected!: any;
  items: MenuItem[] = [];
  filterExcel: any[] = [];
  isSearchPopulation: boolean = false;
  protected form : any = {} as any;
  //create - update

  protected formComponent?: { formGroup: any; reset: () => void };

  constructor(
    protected service: IBaseService<T>,
    protected cdr: ChangeDetectorRef,
    protected dataLoader: DataLoaderService,
    protected excelexport: ExcelExportService,
    protected confirmService: ConfirmService
  ) {}

  load(event?: TableLazyLoadEvent) {
    this.loading = true;
    this.dataLoader
      .loadData(this.service.findByPage.bind(this.service), event)
      .subscribe((response: any) => {
        const result = this.dataLoader.handleResponse(response);
        setTimeout(() => {}, 1500);
        if (result.ok) {
          this.totalRecords = result.totalResults;
          this.data = result.data;
          this.loading = false;
        } else {
          this.loading = false;
        }
      });
    this.cdr.detectChanges();
  }

  create() {
    this.titleForm = this.title;
    this.isFormVisible = true;
    this.isDisplayForm = true;
    this.isEditForm = false;
  }

  update(selected: any) {
    this.onSelectionChange(selected);
  }
  async delete(selected: any) {
    const isConfirm = await this.confirmService.confirmDelete(
      selected.name,
      'Eliminar permiso',
      'Estas seguro de eliminar el permiso',
      'pi pi-exclamation-triangle',
      'Cancelar',
      'Aceptar',
      'secondary'
    );

    if (!isConfirm) {
      this.confirmService.showMessage(
        'error',
        'Cancelado',
        'El permiso no se ha eliminado correctamente'
      );
    }

    if (isConfirm) {
      this.service.delete(selected._id).subscribe({
        next: (response: any) => {
          if (response.statusCode === 200) {
            this.confirmService.showMessage(
              'success',
              'Eliminación',
              'El permiso se ha eliminado correctamente'
            );
          }
        },
        error: (err: any) => {
          console.error(err.error);
          if (err.error.statusCode === 400) {
            this.confirmService.showMessage(
              'error',
              'Error al eliminar permiso',
              err.error.message
            );
          }
        },
        complete: () => this.rechargeTable(),
      });
    }
  }

  save() {
    let id = '';
    if(this.isEditForm) id = (this.initialData as any)?._id;


    const formValues = this.getFormattedFormValues();
    const request$ = this.isEditForm
      ? this.service.update(id, formValues)
      : this.service.create(formValues);

    request$.subscribe({
      next: (response: any) => {
        if (response.statusCode === 200 || response.statusCode === 201) {
          this.closeDialog();
          this.confirmService.showMessage(
            'info',
            (this.isEditForm ? 'Edición' : 'Creación') + ' ' + 'de permiso',
            'El permiso se ha ' +
              (this.isEditForm ? 'editado' : 'creado') +
              ' correctamente'
          );
          this.rechargeTable();
        }
      },
      error: (err: any) => {
        console.error(err.error);
        if (err.error.statusCode === 400) {
          this.confirmService.showMessage(
            'error',
            'Error al ' + (this.isEditForm ? 'editar' : 'crear') + ' permiso',
            err.error.message
          );
        }
      },
      complete: () => this.closeDialog(),
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
      .subscribe((response) => {
        const result = this.dataLoader.handleResponse(response);
        if (result.ok) {
          this.totalRecords = result.totalResults;
          this.data = result.data;
          this.loading = false;
        } else {
          this.loading = false;
        }
      });
    this.cdr.detectChanges();
  }

  queryDate(event: any): void {
    this.loading = true;
    this.filtersGlobal = false;
    this.service
      .findByDate(
        moment(event.initial).format('YYYY-MM-DD'),
        moment(event.final).format('YYYY-MM-DD')
      )
      .subscribe((data: any) => {
        const result = this.dataLoader.handleResponse(data);
        if (result.ok) {
          this.totalRecords = result.totalResults;
          this.data = result.data;
          this.loading = false;
        } else {
          this.loading = false;
        }
      });
  }

  exportAsXLSX(): void {
    this.excelexport.exportAsExcelFile(this.data, 'totalLeaders');
  }

  onSelectionChange(selectedItem: any) {
    if (selectedItem) {
      this.isEditForm = true;
      this.titleForm = 'Edición de permisos';
      this.isFormVisible = true;
      this.isDisplayForm = true;

      this.initialData = {
        ...this.initialData,
        ...selectedItem,
      };
    }
  }

  private getFormattedFormValues(): any {
    const values = { ...this.formComponent?.formGroup?.value };
    return values;
  }

  closeDialog() {
    this.isDisplayForm = false;
    this.isFormVisible = false;
    this.formComponent?.reset();
  }
}

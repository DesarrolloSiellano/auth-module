import { of, Subject, throwError } from 'rxjs';
import { BaseCrud } from './base-crud';
import { ChangeDetectorRef } from '@angular/core';

interface Item {
  _id: string;
  name: string;
}

class TestCrud extends BaseCrud<Item> {}

describe('BaseCrud', () => {
  let crud: TestCrud;
  let service: any;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;
  let dataLoader: any;
  let excelexport: any;
  let confirmService: jasmine.SpyObj<any>;

  beforeEach(() => {
    service = {
      findByPage: jasmine.createSpy('findByPage').and.returnValue(
        of({ data: [{ _id: '1', name: 'A' }], meta: { totalData: 1 } }),
      ),
      findByDate: jasmine.createSpy('findByDate').and.returnValue(
        of({ data: [{ _id: '2', name: 'B' }], meta: { totalData: 1 } }),
      ),
      create: jasmine.createSpy('create').and.returnValue(
        of({ statusCode: 201, data: {}, meta: {} }),
      ),
      update: jasmine.createSpy('update').and.returnValue(
        of({ statusCode: 200, data: {}, meta: {} }),
      ),
      delete: jasmine.createSpy('delete').and.returnValue(
        of({ statusCode: 200, data: null, meta: {} }),
      ),
    };

    cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);
    dataLoader = {
      loadData: jasmine.createSpy('loadData').and.callFake((fn: any) =>
        fn(0, 100, '', '{}'),
      ),
      handleResponse: jasmine
        .createSpy('handleResponse')
        .and.callFake((res: any) => ({
          ok: true,
          totalResults: res.meta.totalData,
          data: res.data,
        })),
    };
    excelexport = jasmine.createSpyObj('ExcelExportService', ['exportAsExcelFile']);
    confirmService = jasmine.createSpyObj('ConfirmService', [
      'showMessage',
      'confirm',
    ]);
    confirmService.confirm.and.returnValue(Promise.resolve(true));

    crud = new TestCrud(service, cdr, dataLoader, excelexport, confirmService);
    (crud as any).formComponent = {
      formGroup: { value: { name: 'test' } },
      reset: () => {},
    };
  });

  it('should load paginated data', () => {
    crud.load({ first: 0, rows: 100, globalFilter: '', filters: {} } as any);

    expect(crud.data).toEqual([{ _id: '1', name: 'A' }]);
    expect(crud.totalRecords).toBe(1);
    expect(crud.loading).toBe(false);
  });

  it('should create an item on save when not editing', () => {
    crud.isEditForm = false;
    crud.isDisplayForm = true;
    crud.save();

    expect(service.create).toHaveBeenCalledWith({ name: 'test' });
    expect(confirmService.showMessage).toHaveBeenCalledWith(
      'info',
      'Creación',
      jasmine.stringMatching('creado'),
    );
    expect(crud.isDisplayForm).toBe(false);
  });

  it('should update an item on save when editing', () => {
    crud.isEditForm = true;
    crud.initialData = { _id: '5', name: 'A' } as Item;
    crud.save();

    expect(service.update).toHaveBeenCalledWith('5', { name: 'test' });
    expect(confirmService.showMessage).toHaveBeenCalledWith(
      'info',
      'Edición',
      jasmine.stringMatching('editado'),
    );
  });

  it('should reset the disabled button on save error', () => {
    service.create.and.returnValue(throwError(() => new Error('boom')));
    spyOn(console, 'error');

    crud.isEditForm = false;
    crud.save();

    expect(crud.disabledButton).toBe(false);
  });

  it('should not send a second request while saving', () => {
    const pending = new Subject<{ statusCode: number }>();
    service.create.and.returnValue(pending.asObservable());
    crud.isEditForm = false;

    crud.save();
    expect(service.create).toHaveBeenCalledTimes(1);
    expect(crud.disabledButton).toBe(true);

    crud.save();
    expect(service.create).toHaveBeenCalledTimes(1);

    pending.next({ statusCode: 201 });
    pending.complete();

    expect(crud.disabledButton).toBe(false);
  });

  it('should delete an item after confirmation', async () => {
    crud.title = 'Items';
    crud.subtitle = 'Item';
    await crud.delete({ _id: '9', name: 'X' } as Item);

    expect(service.delete).toHaveBeenCalledWith('9');
    expect(confirmService.showMessage).toHaveBeenCalledWith(
      'success',
      'Eliminación',
      jasmine.stringMatching('eliminado'),
    );
  });

  it('should not delete when the confirmation is cancelled', async () => {
    confirmService.confirm.and.returnValue(Promise.resolve(false));
    crud.subtitle = 'Item';

    await crud.delete({ _id: '9', name: 'X' } as Item);

    expect(service.delete).not.toHaveBeenCalled();
    expect(confirmService.showMessage).toHaveBeenCalledWith(
      'error',
      'Cancelado',
      jasmine.stringMatching('no se ha eliminado'),
    );
  });

  it('should handle a failed load gracefully', () => {
    dataLoader.handleResponse.and.returnValue({ ok: false });

    crud.load({ first: 0, rows: 100 } as any);

    expect(crud.loading).toBe(false);
    expect(crud.totalRecords).toBe(0);
  });

  it('should query by date range', () => {
    crud.queryDate({ initial: new Date('2026-01-01'), final: new Date('2026-01-31') });

    expect(service.findByDate).toHaveBeenCalled();
    expect(crud.data).toEqual([{ _id: '2', name: 'B' }]);
    expect(crud.totalRecords).toBe(1);
    expect(crud.filtersGlobal).toBe(false);
  });

  it('should open the creation dialog', () => {
    crud.subtitle = 'Item';
    crud.create();

    expect(crud.isEditForm).toBe(false);
    expect(crud.isFormVisible).toBe(true);
    expect(crud.isDisplayForm).toBe(true);
    expect(crud.titleForm).toBe('Creación de Item');
  });

  it('should update through onSelectionChange', () => {
    crud.subtitle = 'Item';
    const selected = { _id: '1', name: 'A' } as Item;
    const spy = spyOn(crud, 'onSelectionChange');
    crud.update(selected);
    expect(spy).toHaveBeenCalledWith(selected);
  });

  it('should export the current data as xlsx', () => {
    crud.data = [{ _id: '1', name: 'A' } as Item];
    crud.exportAsXLSX();
    expect(excelexport.exportAsExcelFile).toHaveBeenCalledWith(crud.data, 'totalLeaders');
  });

  it('should build formatted values from the form component', () => {
    (crud as any).formComponent = {
      formGroup: { value: { name: 'X' } },
      reset: () => {},
    };
    expect(crud.getFormattedFormValues()).toEqual({ name: 'X' } as Item);
  });

  it('should close the dialog and reset state', () => {
    crud.isDisplayForm = true;
    crud.isFormVisible = true;
    crud.disabledButton = true;
    const resetSpy = jasmine.createSpy('reset');
    (crud as any).formComponent = { formGroup: {}, reset: resetSpy };

    crud.closeDialog();

    expect(crud.isDisplayForm).toBe(false);
    expect(crud.isFormVisible).toBe(false);
    expect(crud.disabledButton).toBe(false);
    expect(resetSpy).toHaveBeenCalled();
  });

  it('should set the edit title on selection change', () => {
    crud.subtitle = 'Item';
    crud.onSelectionChange({ _id: '1', name: 'A' } as Item);

    expect(crud.isEditForm).toBe(true);
    expect(crud.titleForm).toBe('Edición de Item');
    expect(crud.isDisplayForm).toBe(true);
  });

  it('should handle a failed date query gracefully', () => {
    dataLoader.handleResponse.and.returnValue({ ok: false });
    crud.queryDate({ initial: new Date('2026-01-01'), final: new Date('2026-01-31') });
    expect(crud.loading).toBe(false);
  });

  it('should treat delete 204 as success', async () => {
    service.delete.and.returnValue(
      of({ statusCode: 204, data: null, meta: {} }),
    );
    crud.subtitle = 'Item';

    await crud.delete({ _id: '9', name: 'X' } as Item);

    expect(confirmService.showMessage).toHaveBeenCalledWith(
      'success',
      'Eliminación',
      jasmine.stringMatching('eliminado'),
    );
  });

  it('should reload the table through recharge', () => {
    spyOn(crud, 'rechargeTable');
    crud.recharge();
    expect(crud.rechargeTable).toHaveBeenCalled();
  });

  it('should reload the table with default pagination', () => {
    crud.rechargeTable();
    expect(dataLoader.loadData).toHaveBeenCalledWith(jasmine.any(Function), {
      first: 0,
      rows: 100,
      globalFilter: '',
      filters: {},
    });
    expect(crud.data).toEqual([{ _id: '1', name: 'A' }]);
  });

  it('should default results when meta/data are missing', () => {
    dataLoader.handleResponse.and.returnValue({ ok: true });
    crud.load({ first: 0, rows: 100 } as any);

    expect(crud.totalRecords).toBe(0);
    expect(crud.data).toEqual([]);
  });

  it('should default results on a missing-meta date query', () => {
    dataLoader.handleResponse.and.returnValue({ ok: true });
    crud.queryDate({ initial: new Date('2026-01-01'), final: new Date('2026-01-31') });

    expect(crud.totalRecords).toBe(0);
    expect(crud.data).toEqual([]);
  });
});

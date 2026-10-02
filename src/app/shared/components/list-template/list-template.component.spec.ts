import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ListTemplateComponent } from './list-template.component';

describe('ListTemplateComponent', () => {
  let component: ListTemplateComponent;
  let fixture: ComponentFixture<ListTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListTemplateComponent],
      providers: [MessageService, ConfirmationService],
    }).compileComponents();

    fixture = TestBed.createComponent(ListTemplateComponent);
    component = fixture.componentInstance;
    // No se llama detectChanges(): evita renderizar la tabla lazy.
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should honor rowSelectableFn (per-row selection)', () => {
    expect(component.isRowSelectable({ id: 1 })).toBe(true);
    expect(component.tableRowSelectable({ data: { id: 1 }, index: 0 })).toBe(
      true,
    );

    fixture.componentRef.setInput(
      'rowSelectableFn',
      (row: { id: number }) => row.id !== 1,
    );

    expect(component.isRowSelectable({ id: 1 })).toBe(false);
    expect(component.isRowSelectable({ id: 2 })).toBe(true);
    expect(component.tableRowSelectable({ data: { id: 1 }, index: 0 })).toBe(
      false,
    );
  });

  it('should emit loadLazy on lazy load', () => {
    let emitted: any;
    component.loadLazy.subscribe((e) => (emitted = e));
    const event = { first: 0, rows: 10 };
    component.loadDataLazy(event as any);
    expect(emitted).toBe(event);
  });

  it('should emit dateQuery with the period', () => {
    fixture.componentRef.setInput('periodoInicio', new Date('2026-01-01'));
    fixture.componentRef.setInput('periodoFin', new Date('2026-01-31'));
    let emitted: any;
    component.dateQuery.subscribe((e) => (emitted = e));

    component.queryDate();

    expect(emitted.initial).toEqual(component.periodoInicio());
    expect(emitted.final).toEqual(component.periodoFin());
  });

  it('should emit create/update/delete events', () => {
    let created = false;
    let updated: any;
    let deleted: any;
    component.create.subscribe(() => (created = true));
    component.update.subscribe((row) => (updated = row));
    component.delete.subscribe((row) => (deleted = row));

    component.onCreate();
    component.onUpdate({ id: 1 });
    component.onDelete({ id: 2 });

    expect(created).toBe(true);
    expect(updated).toEqual({ id: 1 });
    expect(deleted).toEqual({ id: 2 });
  });

  it('should emit selection events', () => {
    let context: any;
    let row: any;
    let view: any;
    component.selectionChange.subscribe((e) => (context = e));
    component.onRowSelectionChange.subscribe((e) => (row = e));
    component.view.subscribe((e) => (view = e));

    component.selected = { id: 1 };
    component.onContextMenuSelect();
    component.onRowSelect();
    component.onView({ id: 9 });

    expect(context).toEqual({ id: 1 });
    expect(row).toEqual({ id: 1 });
    expect(view).toEqual({ id: 9 });
  });

  it('should emit export and reload events', () => {
    let exportedTotal = false;
    let exportedPage = false;
    let reloaded = false;
    component.exportTotal.subscribe(() => (exportedTotal = true));
    component.exportPage.subscribe(() => (exportedPage = true));
    component.reload.subscribe(() => (reloaded = true));

    component.exportAsTotalXLSX();
    component.exportAsXLSX();
    component.recharge();

    expect(exportedTotal).toBe(true);
    expect(exportedPage).toBe(true);
    expect(reloaded).toBe(true);
  });

  it('should toggle the search input visibility', () => {
    component.inputVisible = false;
    component.toggleInput();
    expect(component.inputVisible).toBe(true);
  });
});

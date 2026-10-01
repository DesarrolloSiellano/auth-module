import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ContextMenuModule } from 'primeng/contextmenu';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';



export interface ListColumn {
  field: string;
  header: string;
}

@Component({
  selector: 'app-list-template',
  imports: [
    CommonModule,
    FormsModule,
    ContextMenuModule,
    ToastModule,
    DatePickerModule,
    TableModule,
    ConfirmDialogModule,
    ButtonModule,
    TooltipModule
  ],
  templateUrl: './list-template.component.html',
  styleUrl: './list-template.component.scss'
})
export class ListTemplateComponent {

  readonly periodoInicio = input<Date | null>();
  readonly rowsNumber = input<number>(100);
  readonly title = input<string>('');
  readonly showTitle = input<boolean>(false);
  readonly periodoFin = input<Date | null>();
  readonly options = input<boolean>(true);
  readonly toAdd = input<boolean>(true);
  readonly cols = input<ListColumn[]>([]);
  readonly data = input<unknown[]>([]);
  readonly lazy = input<boolean>(false);
  readonly showCalendarOptions = input<boolean>(false);
  readonly totalRecords = input<number>(0);
  readonly isButtonUpdate = input<boolean>(true);
  readonly loading = input<boolean>(false);
  readonly filtersGlobal = input<boolean>(true);
  readonly items = input<MenuItem[]>([]);
  readonly updateItem = input<unknown>();
  readonly deleteItem = input<unknown>();
  readonly extraActions = input<
    { key: string; icon: string; tooltip?: string; severity?: string; disabled?: boolean }[]
  >([]);
  readonly rowActionsFn = input<
    ((row: any) => { key: string; icon: string; tooltip?: string; severity?: string; disabled?: boolean }[]) | null
  >(null);
  readonly rowSelectableFn = input<((row: any) => boolean) | null>(null);
  readonly showEdit = input<boolean>(true);
  readonly showDelete = input<boolean>(true);
  readonly actionsDisabled = input<boolean>(false);
  readonly bulkSelectable = input<boolean>(false);
  readonly bulkActions = input<
    { key: string; label: string; icon: string; severity?: string }[]
  >([]);

  selected: any;
  inputVisible: boolean = false;

  readonly selectionChange = output<unknown>();
  readonly onRowSelectionChange = output<unknown>();
  readonly bulkSelectionChange = output<unknown[]>();
  readonly loadLazy = output<TableLazyLoadEvent>();
  readonly dateQuery = output<{ initial?: Date | null; final?: Date | null }>();
  readonly create = output<void>();
  readonly update = output<unknown>();
  readonly delete = output<unknown>();
  readonly view = output<unknown>();
  readonly exportTotal = output<void>();
  readonly exportPage = output<void>();
  readonly exportFiltered = output<Table>();
  readonly reload = output<void>();
  readonly extraAction = output<{ key: string; row: unknown }>();
  readonly bulkAction = output<{ key: string; rows: any[] }>();



  loadDataLazy(event: TableLazyLoadEvent) {
    this.loadLazy.emit(event);
  }

  queryDate() {
    this.dateQuery.emit({ initial: this.periodoInicio(), final: this.periodoFin() });
  }

  onCreate() {
    this.create.emit();
  }

  onContextMenuSelect() {
    this.selectionChange.emit(this.selected)
  }

  onRowSelect() {
    if (this.bulkSelectable()) {
      this.bulkSelectionChange.emit(
        Array.isArray(this.selected) ? this.selected : [],
      );
      return;
    }
    this.onRowSelectionChange.emit(this.selected);
  }

  selectedCount(): number {
    return Array.isArray(this.selected) ? this.selected.length : 0;
  }

  onBulkAction(key: string) {
    this.bulkAction.emit({
      key,
      rows: Array.isArray(this.selected) ? this.selected : [],
    });
  }

  onRowUnselect() {
    if (this.bulkSelectable()) {
      this.bulkSelectionChange.emit(
        Array.isArray(this.selected) ? this.selected : [],
      );
    }
  }

  onUpdate(rowData: unknown) {
    this.update.emit(rowData);
  }

  onDelete(rowData: unknown) {
    this.delete.emit(rowData);
  }

  onView(rowData: unknown) {
    this.view.emit(rowData);
  }

  onExtraAction(key: string, rowData: unknown) {
    this.extraAction.emit({ key, row: rowData });
  }

  actionsFor(row: unknown): {
    key: string;
    icon: string;
    tooltip?: string;
    severity?: string;
    disabled?: boolean;
  }[] {
    const fn = this.rowActionsFn();
    return fn ? fn(row) : this.extraActions();
  }

  isRowSelectable(row: unknown): boolean {
    const fn = this.rowSelectableFn();
    return fn ? fn(row) : true;
  }

  /** Se usa como `rowSelectable` del p-table (incluye el "seleccionar todo"). */
  tableRowSelectable = (event: { data: any; index: number }): boolean =>
    this.isRowSelectable(event?.data);


  exportAsTotalXLSX() {
    this.exportTotal.emit();
  }

  exportAsXLSX() {
    this.exportPage.emit();
  }

  exportAsXLSXFilter(dt: Table) {
    this.exportFiltered.emit(dt);
  }

  recharge() {
    this.reload.emit();
  }

  toggleInput() {
    this.inputVisible = !this.inputVisible;
  }

}

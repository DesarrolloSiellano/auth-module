import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ContextMenuModule } from 'primeng/contextmenu';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';



@Component({
  selector: 'app-list-template',
  standalone: true,
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

  @Input() periodoInicio: any;
  @Input() rowsNumber: number = 100;
  @Input() title: String = '';
  @Input() showTitle: boolean = false;
  @Input() periodoFin: any;
  @Input() options: boolean = true;
  @Input() toAdd: boolean = true;
  @Input() cols: any[] = [];
  @Input() data: any[] = [];
  @Input() lazy: boolean = false;
  @Input() showCalendarOptions: boolean = false;
  @Input() totalRecords: number = 0;
  @Input() isButtonUpdate: boolean = true;
  @Input() loading: boolean = false;
  @Input() filtersGlobal: boolean = true;
  @Input() items: MenuItem[] = [];
  @Input() updateItem!: (rowData: any) => void; // Recibe la función update
  @Input() deleteItem!: (rowData: any) => void;

  selected: any;
  inputVisible: boolean = false;




  @Output() selectionChange = new EventEmitter<any>();
  @Output() onRowSelectionChange = new EventEmitter<any>();
  @Output() loadLazy = new EventEmitter<TableLazyLoadEvent>();
  @Output() dateQuery = new EventEmitter<any>();
  @Output() create = new EventEmitter<void>();
  @Output() update = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() view = new EventEmitter<any>();
  @Output() exportTotal = new EventEmitter<void>();
  @Output() exportPage = new EventEmitter<void>();
  @Output() exportFiltered = new EventEmitter<Table>();
  @Output() reload = new EventEmitter<void>();



  loadDataLazy(event: TableLazyLoadEvent) {
    this.loadLazy.emit(event);
  }

  queryDate() {
    this.dateQuery.emit({initial: this.periodoInicio, final: this.periodoFin});
  }

  onCreate() {
    this.create.emit();
  }

  onContextMenuSelect() {
    this.selectionChange.emit(this.selected)
  }

  onRowSelect() {
    this.onRowSelectionChange.emit(this.selected);
  }

  onUpdate(rowData: any) {
    this.update.emit(rowData);
  }

  onDelete(rowData: any) {
    this.delete.emit(rowData);
  }

  onView(rowData: any) {
    this.view.emit(rowData);
  }


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

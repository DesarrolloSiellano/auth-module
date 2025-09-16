import { ChangeDetectorRef, Component } from '@angular/core';
import { BaseCrud } from '../../shared/helpers/base-crud';
import { User } from './interfaces/user.interface';
import { UserService } from './services/user';
import { ListTemplateComponent } from '../../shared/components/list-template/list-template.component';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TableLazyLoadEvent } from 'primeng/table';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [ListTemplateComponent, CommonModule, ReactiveFormsModule, DialogModule, ToastModule, ButtonModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  providers: [UserService],
})
export class Users extends BaseCrud<User> {

  cols = [
    { field: 'name', header: 'Nombres' },
    { field: 'lastName', header: 'Apellidos' },
    { field: 'email', header: 'Correo Electronico' },
    { field: 'username', header: 'Usuario' },
    { field: 'phone', header: 'Teléfono' },
    { field: 'company', header: 'Empresa' },
  ];

  userForm!: FormGroup;

  override title = 'Módulos';
  override subtitle = 'Módulo';

  constructor(
    protected override service: UserService,
    protected override cdr: ChangeDetectorRef,
    protected override dataLoader: DataLoaderService,
    protected override excelexport: ExcelExportService,
    protected override confirmService: ConfirmService
  ) {
    super(service, cdr, dataLoader, excelexport, confirmService);
  }


  onSubmit() {

  }





}

import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { BaseCrud } from '../../shared/helpers/base-crud';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { ModuleService } from './services/module.service';
import { Module, Route } from './interfaces/module.interface';
import { ListTemplateComponent } from '../../shared/components/list-template/list-template.component';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ROLES_FORM } from '../../shared/forms/roles.form';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormValidationUtils } from '../../shared/validations/validations-message';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-modules',
  standalone: true,
  imports: [
    ListTemplateComponent,
    CommonModule,
    ButtonModule,
    ToastModule,
    DialogModule,
    ReactiveFormsModule,
    CheckboxModule,
    FloatLabelModule,
    TextareaModule,
    InputTextModule,
    DividerModule,
    CardModule,
  ],
  templateUrl: './modules.html',
  styleUrl: './modules.scss',
  providers: [
    ModuleService,
    DataLoaderService,
    ExcelExportService,
    ConfirmService,
  ],
})
export class ModulesComponent extends BaseCrud<Module> implements OnInit {
  cols = [
    { field: 'name', header: 'Nombre' },
    { field: 'isActive', header: 'Activo' },
    { field: 'description', header: 'Descripción' },
  ];

  moduleForm!: FormGroup;

  override title = 'Módulos';
  override subtitle = 'Módulo';


  constructor(
    protected override service: ModuleService,
    protected override cdr: ChangeDetectorRef,
    protected override dataLoader: DataLoaderService,
    protected override excelexport: ExcelExportService,
    protected override confirmService: ConfirmService,
    private fb: FormBuilder
  ) {
    super(service, cdr, dataLoader, excelexport, confirmService);
  }

  ngOnInit(): void {
    this.moduleForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      isActive: [true],
      routes: this.fb.array([]), // Arreglo de rutas padre
    });
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.moduleForm.get(controlName);
    return control ? FormValidationUtils.getErrorMessage(control) : null;
  }

  get routes(): FormArray {
    return this.moduleForm.get('routes') as FormArray;
  }

  getChildren(route: AbstractControl): FormArray {
    return route.get('children') as FormArray;
  }

  createRouteGroup(route?: Route): FormGroup {
    return this.fb.group({
      name: [route?.name || '', Validators.required],
      path: [route?.path || '', Validators.required],
      icon: [route?.icon || ''],
      isActive: [route?.isActive ],
      children: this.fb.array(
        route?.children
          ? route.children.map((child) => this.createRouteGroup(child))
          : []
      ),
    });
  }

  // Agregar una ruta padre (vacía)
  addRoute() {
    this.routes.push(this.createRouteGroup());
  }

  // Agregar ruta hija a una ruta padre
  addRouteChild(routeIndex: number) {
    const children = this.routes.at(routeIndex).get('children') as FormArray;
    children.push(this.createRouteGroup());
  }

  // Quitar ruta padre
  removeRoute(index: number) {
    this.routes.removeAt(index);
  }

  // Quitar ruta hijo
  removeRouteChild(routeIndex: number, childIndex: number) {
    const children = this.routes.at(routeIndex).get('children') as FormArray;
    children.removeAt(childIndex);
  }

  // Opcional: cargar datos para editar
  loadModuleData(moduleData: Module) {
    this.moduleForm.patchValue({
      name: moduleData.name,
      description: moduleData.description,
      isActive: moduleData.isActive,
    });
    const routeFGs = moduleData.router.map((route) =>
      this.createRouteGroup(route)
    );
    const routeFormArray = this.fb.array(routeFGs);
    this.moduleForm.setControl('routes', routeFormArray);
  }

  override getFormattedFormValues(): any {
    const values = { ...this.moduleForm?.value };
    return values;
  }


override onSelectionChange(selectedItem: any) {
  console.log(selectedItem);

  if (selectedItem) {
    this.isEditForm = true;
    this.titleForm = 'Edición de ' + this.title;
    this.isFormVisible = true;
    this.isDisplayForm = true;

    this.moduleForm.patchValue({
      name: selectedItem.name,
      description: selectedItem.description,
      isActive: selectedItem.isActive,
    });

    // Usar la propiedad correcta del objeto (routes)
    const rawRoutes = Array.isArray(selectedItem.routes) ? selectedItem.routes : [];
    const routesFormArray = this.fb.array(
      rawRoutes.map((route: any) => this.createRouteGroup(route))
    );
    this.moduleForm.setControl('routes', routesFormArray);

    console.log(this.moduleForm.value);

    this.initialData = {
      ...this.initialData,
      ...selectedItem,
    };
  }
}



  // Enviar datos
  onSubmit() {
    if (this.moduleForm.valid) {
      this.save();
    }
  }
}

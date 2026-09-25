import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { BaseCrud } from '../../shared/helpers/base-crud';
import { DataLoaderService } from '../../shared/services/data-load.service';
import { ExcelExportService } from '../../shared/services/excel-export.service';
import { ConfirmService } from '../../shared/services/confirm-dialog.service';
import { ModuleService } from './services/module.service';
import { Module, Route } from './interfaces/module.interface';
import { ListTemplateComponent } from '../../shared/components/list-template/list-template.component';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Checkbox } from 'primeng/checkbox';
import { FloatLabel } from 'primeng/floatlabel';
import { FormValidationUtils } from '../../shared/validations/validations-message';
import { Textarea } from 'primeng/textarea';
import { InputText } from 'primeng/inputtext';
import { Divider } from 'primeng/divider';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-modules',
  imports: [
    ListTemplateComponent,
    CommonModule,
    Button,
    Dialog,
    ReactiveFormsModule,
    Checkbox,
    FloatLabel,
    Textarea,
    InputText,
    Divider,
    Message,
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

  private readonly fb = inject(FormBuilder);

  constructor() {
    super(
      inject(ModuleService),
      inject(ChangeDetectorRef),
      inject(DataLoaderService),
      inject(ExcelExportService),
      inject(ConfirmService),
    );
  }

  ngOnInit(): void {
    this.moduleForm = this.buildEmptyForm();
  }

  private buildEmptyForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      isActive: [true],
      routes: this.fb.array([]), // Arreglo de rutas padre
    });
  }

  override create(): void {
    this.moduleForm = this.buildEmptyForm();
    super.create();
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.moduleForm.get(controlName);
    return control ? FormValidationUtils.getErrorMessage(control) : null;
  }

  getRowErrorMessage(group: AbstractControl, controlName: string): string | null {
    const control = group.get(controlName);
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
      initPath: [route?.initPath || ''],
      icon: [route?.icon || ''],
      isActive: [route?.isActive],
      children: this.fb.array(
        route?.children
          ? route.children.map((child: Route) => this.createRouteGroup(child))
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
    this.moduleForm.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  // Quitar ruta hijo
  removeRouteChild(routeIndex: number, childIndex: number) {
    const children = this.routes.at(routeIndex).get('children') as FormArray;
    children.removeAt(childIndex);
  }

  // Opcional: cargar datos para editar
  override getFormattedFormValues(): Module {
    const values = { ...this.moduleForm?.value };
    return values;
  }

  override onSelectionChange(selectedItem: Module & { router?: Route[] }) {
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

      // Usar la propiedad correcta del objeto (routes o router)
      const rawRoutes = Array.isArray(selectedItem.routes)
        ? selectedItem.routes
        : Array.isArray(selectedItem.router)
        ? selectedItem.router
        : [];
      const routesFormArray = this.fb.array(
        rawRoutes.map((route: Route) => this.createRouteGroup(route))
      );
      this.moduleForm.setControl('routes', routesFormArray);



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

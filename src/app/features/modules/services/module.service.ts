import { inject, Injectable } from '@angular/core';
import { BaseService } from '../../../shared/services/base.service';
import { Module } from '../interfaces/module.interface';
import { Response } from '../../../shared/interfaces/response.interface';
import { HttpClient } from '@angular/common/http';
import { ENVIROMENT } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ModuleService extends BaseService<Module, Response<Module[]>> {

  constructor() {
    super(inject(HttpClient), `${ENVIROMENT.urlApi}/modules`);
  }

}

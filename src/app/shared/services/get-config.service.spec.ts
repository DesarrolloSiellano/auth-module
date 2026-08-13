import { TestBed } from '@angular/core/testing';
import { GetConfigAppService } from './get-config.service';
import { ENVIROMENT } from '../../../enviroments/enviroment';

describe('GetConfigAppService', () => {
  let service: GetConfigAppService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetConfigAppService);
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty module when not stored', () => {
    expect(service.getModule()).toEqual({} as any);
  });

  it('should parse the module from localStorage', () => {
    const module: any = {
      _id: 'm1',
      name: ENVIROMENT.storageKey,
      isActive: true,
      routes: [{ name: 'Pages', path: '/pages', icon: 'layout' }],
    };
    localStorage.setItem(ENVIROMENT.storageKey, JSON.stringify(module));

    expect(service.getModule()).toEqual(module);
    expect(service.getRoutes()).toEqual(module.routes);
  });

  it('should return empty routes for an invalid module JSON', () => {
    localStorage.setItem(ENVIROMENT.storageKey, '{invalid');
    expect(service.getRoutes()).toEqual([]);
  });

  it('should return the stored user name', () => {
    localStorage.setItem('userName', 'John Doe');
    expect(service.getUserName()).toBe('John Doe');
  });
});

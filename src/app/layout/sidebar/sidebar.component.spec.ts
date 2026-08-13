import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { GetConfigAppService } from '../../shared/services/get-config.service';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let getConfigMock: jasmine.SpyObj<GetConfigAppService>;

  beforeEach(async () => {
    getConfigMock = jasmine.createSpyObj('GetConfigAppService', [
      'getRoutes',
      'getModule',
    ]);
    getConfigMock.getRoutes.and.returnValue([
      { name: 'Pages', path: '/pages', icon: 'layout', isActive: true, children: [] },
      { name: 'Dashboard', path: '/pages/dashboard', icon: 'home', isActive: true },
    ] as any);

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        { provide: GetConfigAppService, useValue: getConfigMock },
      ],
    })
      .overrideComponent(SidebarComponent, {
        remove: { providers: [GetConfigAppService] },
        add: { providers: [{ provide: GetConfigAppService, useValue: getConfigMock }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load routes from the config service', () => {
    expect(component.routes.length).toBe(2);
    expect(component.routes[0].open).toBe(true);
  });

  it('should toggle submenu visibility', () => {
    component.toggleSubmenu(component.routes[0]);
    expect(component.routes[0].open).toBe(false);
    component.toggleSubmenu(component.routes[0]);
    expect(component.routes[0].open).toBe(true);
  });
});

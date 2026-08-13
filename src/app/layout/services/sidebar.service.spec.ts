import { TestBed } from '@angular/core/testing';
import { SidebarService } from './sidebar.service';

describe('SidebarService', () => {
  let service: SidebarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SidebarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with the sidebar open', (done) => {
    service.sidebarState.subscribe((state) => {
      expect(state).toBe(true);
      done();
    });
  });

  it('should toggle the sidebar state', (done) => {
    const states: boolean[] = [];
    service.sidebarState.subscribe((state) => states.push(state));

    service.toggleSidebar();
    service.toggleSidebar();

    expect(states).toEqual([true, false, true]);
    done();
  });
});

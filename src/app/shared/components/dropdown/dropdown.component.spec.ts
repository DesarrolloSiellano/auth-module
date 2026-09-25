import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconDropdownComponent } from './dropdown.component';

describe('IconDropdownComponent', () => {
  let component: IconDropdownComponent;
  let fixture: ComponentFixture<IconDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconDropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should execute the option action and close', () => {
    let executed = false;
    fixture.componentRef.setInput('options', [
      { label: 'Acción', action: () => (executed = true) },
    ]);

    component.execute(component.options()[0].action);

    expect(executed).toBe(true);
    expect((component as any).overlayRef).toBeUndefined();
  });

  it('should open an overlay attached to the dropdown template', () => {
    fixture.componentRef.setInput('options', [
      { label: 'A', action: () => undefined },
    ]);
    const trigger = document.createElement('button');

    component.open(trigger);

    expect((component as any).overlayRef).toBeTruthy();
  });

  it('should close an existing overlay before opening a new one', () => {
    component.open(document.createElement('button'));
    const firstRef = (component as any).overlayRef;
    spyOn(firstRef, 'dispose').and.callThrough();

    component.open(document.createElement('button'));

    expect(firstRef.dispose).toHaveBeenCalled();
  });

  it('should dispose the overlay on close', () => {
    component.open(document.createElement('button'));
    const overlayRef = (component as any).overlayRef;
    spyOn(overlayRef, 'dispose').and.callThrough();

    component.close();

    expect(overlayRef.dispose).toHaveBeenCalled();
    expect((component as any).overlayRef).toBeUndefined();
  });

  it('should dispose the overlay on destroy', () => {
    component.open(document.createElement('button'));
    const overlayRef = (component as any).overlayRef;
    spyOn(overlayRef, 'dispose').and.callThrough();

    fixture.destroy();

    expect(overlayRef.dispose).toHaveBeenCalled();
  });
});

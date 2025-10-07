import {
  Component,
  ElementRef,
  Input,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  OnDestroy,
} from '@angular/core';
import {
  Overlay,
  OverlayModule,
  OverlayRef,
  OverlayPositionBuilder,
} from '@angular/cdk/overlay';
import { TemplatePortal, PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';

interface DropdownOption {
  label: string;
  action: () => void;
}

@Component({
  selector: 'app-icon-dropdown',
  imports: [CommonModule, OverlayModule, PortalModule],
  template: `
    <ng-template #dropdownTemplate>
      <div class="dropdown-panel" (click)="$event.stopPropagation()">
        @for (option of options; track option) {
        <button type="button" (click)="execute(option.action)">
          {{ option.label }}
        </button>
        }
      </div>
    </ng-template>
  `,
  styleUrls: ['./dropdown.component.scss'],
  standalone: true,
})
export class IconDropdownComponent {
  @Input() options: DropdownOption[] = [];
  @ViewChild('dropdownTemplate') dropdownTemplate!: TemplateRef<any>;

  private overlayRef?: OverlayRef;

  constructor(
    private overlay: Overlay,
    private positionBuilder: OverlayPositionBuilder,
    private viewContainerRef: ViewContainerRef
  ) {}

  open(triggerElement: HTMLElement) {
    // Si ya existe overlay, ciérralo antes
    this.close();

    const positionStrategy = this.positionBuilder
      .flexibleConnectedTo(triggerElement)
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 4,
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });

    this.overlayRef.backdropClick().subscribe(() => this.close());

    const portal = new TemplatePortal(
      this.dropdownTemplate,
      this.viewContainerRef
    );
    this.overlayRef.attach(portal);
  }

  close() {
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
  }

  execute(action: () => void) {
    action();
    this.close();
  }

  ngOnDestroy() {
    this.close();
  }
}

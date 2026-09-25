import {
  Component,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  OnDestroy,
  inject,
  input,
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
      <div class="dropdown-panel" (click)="$event.stopPropagation()"
        (keydown)="$event.stopPropagation()">
        @for (option of options(); track option) {
        <button type="button" (click)="execute(option.action)">
          {{ option.label }}
        </button>
        }
      </div>
    </ng-template>
  `,
  styleUrls: ['./dropdown.component.scss'],
})
export class IconDropdownComponent implements OnDestroy {
  readonly options = input<DropdownOption[]>([]);
  @ViewChild('dropdownTemplate') dropdownTemplate!: TemplateRef<unknown>;

  private overlayRef?: OverlayRef;
  private readonly overlay = inject(Overlay);
  private readonly positionBuilder = inject(OverlayPositionBuilder);
  private readonly viewContainerRef = inject(ViewContainerRef);

  open(triggerElement: HTMLElement) {
    // Si ya existe overlay, ciérralo antes
    this.close();

    const positionStrategy = this.positionBuilder
      .flexibleConnectedTo(triggerElement)
      .withFlexibleDimensions(false)
      .withPush(true)
      .withViewportMargin(8)
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 4,
        },
        {
          originX: 'end',
          originY: 'top',
          overlayX: 'end',
          overlayY: 'bottom',
          offsetX: 0,
          offsetY: -4,
        },
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
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

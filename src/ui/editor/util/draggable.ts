import {
  Directive,
  EventEmitter,
  ElementRef,
  HostListener,
  Output
} from '@angular/core';

import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {EventBus, EventType} from 'ui/common/event-bus';

@Directive({
  selector: '[hotspot-icon]'
})
export class DraggableIcon {

  @Output() onMove = new EventEmitter();
  @Output() onMoveEnd = new EventEmitter();

  private isActive: boolean = false;
  private startX: number;
  private startY: number;
  private absoluteStartX: number;
  private absoluteStartY: number;
  private mouseMoveSubscription: Subscription;
  private subscriptions: Set<Subscription> = new Set<Subscription>();

  private touchLocation = {x: 0, y: 0};

  constructor(
    private element: ElementRef,
    private eventBus: EventBus
  ) {}

  ngOnInit() {
    const onMouseUp = this.eventBus.getObservable(EventType.MOUSE_UP)
      .subscribe(event => this.onMouseUp(event), error => console.log('error', error));
    this.subscriptions.add(onMouseUp);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.unSubscribeToMouseMovements();
  }

  @HostListener('mousedown', ['$event'])
  private onMouseDown(event) {
    if (event.target.id !== 'draggableIcon') {
      return; // only allow the icon to be the draggable component
    }
    event.preventDefault();
    event.stopPropagation();

    this.subscribeToMouseMovements();
    const boundingRect = this.element.nativeElement.getBoundingClientRect();
    this.startX = event.clientX - boundingRect.left;
    this.startY = event.clientY - boundingRect.top;
    this.absoluteStartX = event.clientX;
    this.absoluteStartY = event.clientY;
    this.isActive = true;
    return false;
  }

  private onMouseMove(event) {
    event.preventDefault();
    if (!this.isActive) {
      return;
    }
    const x: number = event.clientX - this.startX;
    const y: number = event.clientY - this.startY;
    this.onMove.emit({
      x: x,
      y: y,
      shiftKey: event.shiftKey
    });
  }

  private subscribeToMouseMovements() {
    this.mouseMoveSubscription = this.eventBus.getObservable(EventType.MOUSE_MOVE)
      .subscribe(event => this.onMouseMove(event), error => console.log('error', error));
  }

  private unSubscribeToMouseMovements() {
    if (this.mouseMoveSubscription) {
      this.mouseMoveSubscription.unsubscribe();
      this.mouseMoveSubscription = null;
    }
  }

  private onMouseUp(event) {
    this.unSubscribeToMouseMovements();
    if (!this.isActive) {
      return;
    }
    const totalDistance: number = getTotalDistance(
      event.clientX, this.absoluteStartX,
      event.clientY, this.absoluteStartY
    );
    const didMove: boolean = totalDistance > 0;

    this.onMoveEnd.emit({
      x: event.clientX - this.startX,
      y: event.clientY - this.startY,
      shiftKey: event.shiftKey,
      didMove: didMove
    });
    this.isActive = false;
  }

}

function getTotalDistance(x1, x2, y1, y2): number {
  return Math.sqrt(
    Math.pow(x1 - x2, 2) +
    Math.pow(y1 - y2, 2)
  );
}

import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { EventBus } from 'ui/common/event-bus';

const instanceSet: Set<DraggableIcon> = new Set<DraggableIcon>();

// TODO: add touch
document.addEventListener('mousemove', $event =>
  instanceSet.forEach(instance => instance.onMouseMove($event)),
);
document.addEventListener('mouseup', $event =>
  instanceSet.forEach(instance => instance.onMouseUp($event)),
);
document.addEventListener('touchmove', $event => {
  instanceSet.forEach((instance: DraggableIcon) => instance.onTouchMove($event));
}, { passive: false });
document.addEventListener('touchend', $event => {
  instanceSet.forEach((instance: DraggableIcon) => instance.onTouchEnd($event));
}, false);

@Directive({
  selector: '[hotspot-icon]',
})
export class DraggableIcon {

  @Output() onMove = new EventEmitter();
  @Output() onMoveEnd = new EventEmitter();

  private isActive: boolean = false;
  private startX: number;
  private startY: number;
  private absoluteStartX: number;
  private absoluteStartY: number;
  private touchLocation = { x: 0, y: 0 };

  constructor(
    private element: ElementRef,
    private eventBus: EventBus,
  ) {
  }

  ngOnInit() {
    instanceSet.add(this);
  }

  ngOnDestroy() {
    instanceSet.delete(this);
  }

  @HostListener('mousedown', ['$event'])
  private onMouseDown(event) {
    if (event.target.id !== 'draggableIcon') {
      return; // only allow the icon to be the draggable component
    }
    event.preventDefault();
    const boundingRect = this.element.nativeElement.getBoundingClientRect();
    this.startX = event.clientX - boundingRect.left;
    this.startY = event.clientY - boundingRect.top;
    this.absoluteStartX = event.clientX;
    this.absoluteStartY = event.clientY;
    this.isActive = true;
    return false;
  }

  @HostListener('touchstart', ['$event'])
  private onTouchStart($event) {
    if ($event.touches.length > 1) {
      return;
    }
    const x = $event.touches[0].clientX;
    const y = $event.touches[0].clientY;
    this.touchLocation.x = x;
    this.touchLocation.y = y;
    $event.clientX = x;
    $event.clientY = y;
    this.onMouseDown($event);
  }

  onMouseMove(event) {
    if (!this.isActive) {
      return;
    }
    event.preventDefault();
    const x: number = event.clientX - this.startX;
    const y: number = event.clientY - this.startY;
    this.onMove.emit({
      x: x,
      y: y,
      shiftKey: event.shiftKey,
    });
  }

  onMouseUp(event) {
    if (!this.isActive) {
      return;
    }
    const totalDistance: number = getTotalDistance(
      event.clientX, this.absoluteStartX,
      event.clientY, this.absoluteStartY,
    );
    const didMove: boolean = totalDistance > 0;

    this.onMoveEnd.emit({
      x: event.clientX - this.startX,
      y: event.clientY - this.startY,
      shiftKey: event.shiftKey,
      didMove: didMove,
    });
    this.isActive = false;
  }

  onTouchMove($event) {
    const x = $event.touches[0].clientX;
    const y = $event.touches[0].clientY;
    this.touchLocation.x = x;
    this.touchLocation.y = y;
    $event.clientX = x;
    $event.clientY = y;
    this.onMouseMove($event);
  }

  onTouchEnd($event) {
    if ($event.touches.length > 0) {
      return;
    }
    $event.clientX = this.touchLocation.x;
    $event.clientY = this.touchLocation.y;
    this.onMouseUp($event);
  }

}

function getTotalDistance(x1, x2, y1, y2): number {
  return Math.sqrt(
    Math.pow(x1 - x2, 2) +
    Math.pow(y1 - y2, 2),
  );
}

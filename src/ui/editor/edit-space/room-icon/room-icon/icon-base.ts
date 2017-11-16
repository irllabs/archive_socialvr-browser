import {
  ViewChild,
  Output,
  EventEmitter,
  NgZone
} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';

import {Hotspot} from 'ui/editor/interfaces/hotspot';
import {EventBus, EventType} from 'ui/common/event-bus';
import {Vector2} from 'data/scene/entities/vector2';

import {
  normalizeAbsolutePosition,
  denormalizePosition
} from 'ui/editor/util/iconPositionUtil';

import {
  ICON_PATH,
  ROOM_ICON_BUFFER_WIDTH,
  ROOM_ICON_BUFFER_HEIGHT
} from 'ui/common/constants';


export abstract class IconBase implements Hotspot {

  @ViewChild('iconElement') iconElement;
  @Output() onIconDragEnd = new EventEmitter();

  protected propertyEditorIsVisible: boolean = false;
  private screenPosition: Vector2 = new Vector2(0, 0);
  protected iconPath: string;
  protected subscriptions: Set<Subscription> = new Set<Subscription>();
  private windowDimensions: Vector2 = new Vector2(window.innerWidth, window.innerHeight);

  constructor(
    protected eventBus: EventBus,
    protected ngZone: NgZone
  ) {}

  ngOnInit() {
    this.updatePosition();

    this.subscriptions.add(
      this.eventBus.getObservable(EventType.WINDOW_RESIZE)
        .subscribe(
          windowDims => {
            this.windowDimensions.setX(windowDims.x);
            this.windowDimensions.setY(windowDims.y);
          },
          error => console.log('EditSpaceFlat.onResize', error)
        )
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  setPosition(location: Vector2) {
    const absolutePosition: Vector2 = denormalizePosition(location.getX(), location.getY());
    const adjustedX: number = absolutePosition.getX() - ROOM_ICON_BUFFER_WIDTH;
    const adjustedY: number = absolutePosition.getY() - ROOM_ICON_BUFFER_HEIGHT;
    this.setPixelLocation(adjustedX, adjustedY);
    this.setScreenPosition(absolutePosition.getX(), absolutePosition.getY());
  }

  onOffClick($event) {
    if (!$event.isOffClick) return;
    this.setPropertyEditorVisibility(false);
  }

  // Hotspot interface method
  //set absolute screen position without updating the data model
  setPixelLocation(x: number, y: number) {
    this.iconElement.nativeElement.style.left = `${x}px`;
    this.iconElement.nativeElement.style.top = `${y}px`;
  }

  // Hotspot interface method
  setPixelLocationWithBuffer(x: number, y: number) {
    const adjustedX: number = x - ROOM_ICON_BUFFER_WIDTH;
    const adjustedY: number = y - ROOM_ICON_BUFFER_HEIGHT;
    this.setScreenPosition(adjustedX, adjustedY);
    this.setPixelLocation(adjustedX, adjustedY);
  }

  // $sidebar-width: 280px;
  // $property-editor-height: 200px;
  setScreenPosition(x: number, y: number) {
    const shift = {
      right: x < (280 / 2),
      left: x > this.windowDimensions.getX() - (280 / 2),
      up: y > this.windowDimensions.getY() - 200
    };
    this.screenPosition.setPosition(x, y);
  }

  onMove($event) {
    const x: number = $event.x + ROOM_ICON_BUFFER_WIDTH;
    const y: number = $event.y + ROOM_ICON_BUFFER_HEIGHT;

    if ($event.shiftKey) {
      if (this.onIconDragEnd.observers.length) {
        // snap to grid in 3D view
        this.onIconDragEnd.emit({
          setIconLocation: (x: number, y: number) => {
            this.setLocation(snapToGrid(new Vector2(x, y)));
          },
          x: x,
          y: y
        });
      }
      else {
        // snap to grid in 2D view
        const normalizedLocation: Vector2 = normalizeAbsolutePosition(x, y);
        const snappedLocation: Vector2 = snapToGrid(normalizedLocation);
        const denormalizedPosition: Vector2 = denormalizePosition(snappedLocation.getX(), snappedLocation.getY());
        this.setScreenPosition(denormalizedPosition.getX(), denormalizedPosition.getY());
        this.setPixelLocation(
          denormalizedPosition.getX() - ROOM_ICON_BUFFER_WIDTH,
          denormalizedPosition.getY() - ROOM_ICON_BUFFER_HEIGHT
        );
      }
    }
    else {
      // don't snap to grid
      this.setScreenPosition(x, y);
      this.setPixelLocation($event.x, $event.y);
    }

    //this.combinedHotspotUtil.onIconMove(this.roomProperty, x, y);
  }

  onMoveEnd($event) {
    if (!$event.didMove) {
      setTimeout(() => {this.setPropertyEditorVisibility(true);}, 200);      //this.setPropertyEditorVisibility(true);
      return;
    }

    const adjustedX: number = $event.x + ROOM_ICON_BUFFER_WIDTH;
    const adjustedY: number = $event.y + ROOM_ICON_BUFFER_HEIGHT;

    // if parent components are observing onIconDragEnd
    // (such as edit-space-sphere), then notify parent
    // with coordinates and callback function to set model position
    if (this.onIconDragEnd.observers.length) {
      this.onIconDragEnd.emit({
        setIconLocation: (x: number, y: number) => {
          let location: Vector2 = new Vector2(x, y);
          if (!$event.shiftKey) {
            location = snapToGrid(location);
          }
          // this.roomProperty.setLocation(location);
          this.setLocation(location);
        },
        x: adjustedX,
        y: adjustedY
      });
    }
    // if parent components are not observing onIconDragEnd
    // (such as edit-space-flat), then simply set the model position
    else {
      let location: Vector2 = normalizeAbsolutePosition(adjustedX, adjustedY);
      if (!$event.shiftKey) {
        location = snapToGrid(location);
      }
      // this.roomProperty.setLocation(location);
      this.setLocation(location);
    }

    // TODO: combined hotspot logic
    //const activeNeighborId: string = this.combinedHotspotUtil.getActiveNeighborId();
  }

  // Hotspot interface method
  getScreenPosition(): Vector2 {
    return this.screenPosition;
  }

  setPropertyEditorVisibility(isVisible: boolean) {
    if (this.propertyEditorIsVisible === isVisible) {
      return;
    }
    this.ngZone.run(() => {
      this.propertyEditorIsVisible = isVisible;
      this.eventBus.onHotspotVisibility(isVisible);
    });
  }

    // Hotspot interface method
  abstract getLocation(): Vector2;

  abstract setLocation(location: Vector2);

  abstract onSelect($event);

  abstract updatePosition();

  abstract getName(): string;

  abstract onNameChange($event);

}

const ROUND_UNIT: number = 0.5;

function round(n: number, precision: number): number {
  return Math.round(n * precision) / precision;
}

function snapToGrid(position: Vector2): Vector2 {
  return new Vector2(
    round(position.getX(), ROUND_UNIT),
    round(position.getY(), ROUND_UNIT)
  );
}

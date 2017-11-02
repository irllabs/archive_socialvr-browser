import {
  Component,
  Input,
  ViewChild,
  ViewChildren,
  Output,
  EventEmitter,
  NgZone
} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';
import {onResize} from 'ui/editor/util/threeUtil';

import {Hotspot} from 'ui/editor/interfaces/hotspot';
import {IconBase} from 'ui/editor/edit-space/room-icon/room-icon/icon-base';
import {EventBus, EventType} from 'ui/common/event-bus';
import {RoomProperty} from 'data/scene/interfaces/roomProperty';
import {Vector2} from 'data/scene/entities/vector2';
import {Door} from 'data/scene/entities/door';
import {RoomPropertyTypeService} from 'ui/editor/util/roomPropertyTypeService';
import {PropertyRemovalService} from 'ui/editor/util/propertyRemovalService';
import {CombinedHotspotUtil} from 'ui/editor/util/combinedHotspotUtil';

import {
  normalizeAbsolutePosition,
  denormalizePosition
} from 'ui/editor/util/iconPositionUtil';

import {
  ICON_PATH,
  ROOM_ICON_BUFFER_WIDTH,
  ROOM_ICON_BUFFER_HEIGHT
} from 'ui/common/constants';

const ICON_MAP = {
  text: 'text_filled.png',
  image: 'image_filled.png',
  audio: 'audio_filled.png',
  door: 'door_filled.png',
  link: 'link_filled.png'
};

const iconSizes = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE'
};

@Component({
  selector: 'room-icon',
  styleUrls: ['./room-icon.scss'],
  templateUrl: './room-icon.html'
})
export class RoomIcon extends IconBase {

  @Input() roomProperty: RoomProperty;

  private isPossibleCombinedHotspot: boolean = false;
  private propertyType: string;
  private hotspotIconSize: string = iconSizes.LARGE;

  constructor(
    protected eventBus: EventBus,
    private propertyRemovalService: PropertyRemovalService,
    private combinedHotspotUtil: CombinedHotspotUtil,
    protected ngZone: NgZone
  ) {
    super(eventBus, ngZone);
  }


  ngOnInit() {
    this.propertyType = RoomPropertyTypeService.getTypeString(this.roomProperty);
    this.iconPath = `${ICON_PATH}${ICON_MAP[this.propertyType]}`;

    this.subscriptions.add(
      this.eventBus.getObservable(EventType.SELECT_PROPERTY)
        .subscribe(
          event => {
            // if a door is added and there are more than 2 rooms, then open the property editor
            if (event.shouldOpenEditor &&  event.propertyId === this.roomProperty.getId()) {
              this.setPropertyEditorVisibility(true);
            }
          },
          error => console.log('error', error)
      )
    );

    this.subscriptions.add(
      this.eventBus.getObservable(EventType.WINDOW_RESIZE)
       .subscribe(
         windowDims => this.onResize(windowDims),
         error => console.log('EditSpaceFlat.onResize', error)
       )
    );


    super.ngOnInit();
    this.onResize({
      x: window.innerWidth,
      y: window.innerHeight
    })
  }

  onResize(windowDims) {
    if (windowDims.x<767) {
      this.hotspotIconSize = iconSizes.SMALL;
    }
    else if (windowDims.x<992) {
      this.hotspotIconSize = iconSizes.MEDIUM;
    }
    else {
      this.hotspotIconSize = iconSizes.LARGE;
    }
  }

  updatePosition() {
    super.setPosition(this.roomProperty.getLocation());
  }

  // Hotspot interface method
  getName(): string {
    return this.roomProperty.getName();
  }

  onNameChange($event) {
    this.roomProperty.setName($event.text);
    if (this.propertyIs('door')) {
      (this.roomProperty as Door).setNameIsCustom(true);
    }
  }

  propertyIs(propertyType: string): boolean {
    return this.propertyType === propertyType;
  }

  onSelect($event) {
    this.eventBus.onSelectProperty(this.roomProperty.getId(), false);
  }

  onDeselect($event) {
    this.propertyEditorIsVisible = false;
    this.eventBus.onHotspotVisibility(this.propertyEditorIsVisible);
  }

  onDeleteClick($event) {
    this.propertyRemovalService.removeProperty(this.roomProperty);
  }

  isPossibleHotspot(): boolean {
    return this.roomProperty.getPossibleCombinedHotspot();
  }

  setIsPossibleHotsport(isPossibleCombinedHotspot: boolean) {
    this.roomProperty.setPossibleCombinedHotspot(isPossibleCombinedHotspot);
  }

  getLocation(): Vector2 {
    return this.roomProperty.getLocation();
  }

  setLocation(location: Vector2) {
    this.roomProperty.setLocation(location);
  }

}

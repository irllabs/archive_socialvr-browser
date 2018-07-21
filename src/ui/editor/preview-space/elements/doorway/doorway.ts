import { AfterViewInit, Component, NgZone, ViewChild, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { EventEmitter } from 'events';
import { ICON_PATH } from 'ui/common/constants';

import './aframe/doorway';
import './aframe/doorway-pulsating-marker';

@Component({
  selector: '[nga-doorway]',
  templateUrl: './doorway.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Doorway {

  @Input() doorway: any;

  protected get params() {
    const { location, roomId, autoTime } = this.doorway;

    return `coordinates: ${location.x} ${location.y};
            roomId: ${roomId};
            autoTime: ${autoTime}`;
  }

  protected get iconDoorHotspot() {
    return `${ICON_PATH}icon-doorhotspot.png`;
  }

  protected get iconHotspot() {
    return `${ICON_PATH}icon-hotspot-default.png`;
  }

  protected get name() {
    return this.doorway.name;
  }
}
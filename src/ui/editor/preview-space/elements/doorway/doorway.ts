import { AfterViewInit, Component, NgZone, ViewChild, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { EventEmitter } from 'events';
import './aframe/doorway';
import './aframe/doorway-pulsating-marker';

@Component({
  selector: '[nga-doorway]',
  templateUrl: './doorway.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Doorway {

  @Input() doorway: any;

  get params() {
    const { location, roomId } = this.doorway;
    
    return `coordinates: ${location.x} ${location.y};
            roomId: ${roomId}`;
  }
  
  get name() {
    return this.doorway.name;
  }
}
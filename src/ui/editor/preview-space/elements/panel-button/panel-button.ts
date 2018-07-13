import { AfterViewInit, Component, NgZone, ViewChild, Input } from '@angular/core';
import { getCoordinatePosition } from 'ui/editor/util/iconPositionUtil';

import './aframe/panel-button';

@Component({
  selector: '[nga-panel-button]',
  templateUrl: './panel-button.html',
})
export class PanelButton {
  @Input() event: string;
  @Input() icon: string;

  get params() {
    return `event: ${this.event};`;
  }
}
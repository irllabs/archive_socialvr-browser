import { Component, NgZone } from '@angular/core';


@Component({
  selector: 'room-editor-icon',
  styleUrls: ['./room-editor-icon.scss'],
  templateUrl: './room-editor-icon.html',
})
export class RoomEditorIcon {

  private inspectorIsVisible = false;

  constructor(
    protected ngZone: NgZone,
  ) {
  }

  onSelect($event) {
    this.inspectorIsVisible = true;
  }

  onOffClick($event) {
    if (!$event.isOffClick) return;
    this.ngZone.run(() => this.inspectorIsVisible = false);
  }

}

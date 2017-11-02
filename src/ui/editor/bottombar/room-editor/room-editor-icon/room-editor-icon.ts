import {
  Component,
  EventEmitter,
  NgZone
} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';


@Component({
  selector: 'room-editor-icon',
  styleUrls: ['./room-editor-icon.scss'],
  templateUrl: './room-editor-icon.html'
})
export class RoomEditorIcon {

  private inspectorIsVisible = false;

  constructor(
    protected ngZone: NgZone
  ) {}

  onSelect($event) {
    this.inspectorIsVisible = true;
  }

  onOffClick($event) {
    if (!$event.isOffClick) return;
    this.ngZone.run(() => this.inspectorIsVisible = false);
  }

}

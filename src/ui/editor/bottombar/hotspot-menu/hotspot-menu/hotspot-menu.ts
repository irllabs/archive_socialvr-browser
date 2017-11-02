import {Component, Output, EventEmitter, NgZone} from '@angular/core';

@Component({
  selector: 'hotspot-menu',
  styleUrls: ['./hotspot-menu.scss'],
  templateUrl: './hotspot-menu.html'
})
export class HotspotMenu {

  @Output() onMenuChange = new EventEmitter();
  private isOpen: boolean = false;

  constructor(private ngZone: NgZone) {}

  private onOffClick($event) {
    if (!$event.isOffClick) return;
    this.ngZone.run(() => {
      this.isOpen = false;
      this.onMenuChange.emit({isOpen: this.isOpen});
    });
  }

  private onFabClick($event) {
    this.isOpen = !this.isOpen;
    this.onMenuChange.emit({isOpen: this.isOpen});
  }

}

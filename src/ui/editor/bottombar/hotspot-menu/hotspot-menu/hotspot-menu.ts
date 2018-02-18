import {Component, Output, ElementRef, EventEmitter, HostListener} from '@angular/core';

@Component({
  selector: 'hotspot-menu',
  styleUrls: ['./hotspot-menu.scss'],
  templateUrl: './hotspot-menu.html'
})
export class HotspotMenu {

  @Output() onMenuChange = new EventEmitter();
  private isOpen: boolean = false;

  constructor(
    private element: ElementRef
  ) {}

  @HostListener('document:click', ['$event'])
  private onDocumentClick($event) {
    const isClicked: boolean = this.element.nativeElement.contains($event.target);
    if (!isClicked) {
      this.isOpen = false;
      this.onMenuChange.emit({isOpen: this.isOpen});
    }
  }

  private onFabClick($event) {
    this.isOpen = !this.isOpen;
    this.onMenuChange.emit({isOpen: this.isOpen});
  }

}

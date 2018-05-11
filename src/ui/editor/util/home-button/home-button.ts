import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'close-button',
  styleUrls: ['./close-button.scss'],
  templateUrl: './close-button.html',
})
export class CloseButton {

  @Output() onButtonClick = new EventEmitter();

  private onClick($event) {
    this.onButtonClick.emit(null);
  }

}

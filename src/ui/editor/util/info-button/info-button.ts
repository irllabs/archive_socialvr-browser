import {Component, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'info-button',
  styleUrls: ['./info-button.scss'],
  templateUrl: './info-button.html'
})
export class InfoButton {

  @Output() onButtonClick = new EventEmitter();

  private onClick($event) {
    this.onButtonClick.emit(null);
  }

}

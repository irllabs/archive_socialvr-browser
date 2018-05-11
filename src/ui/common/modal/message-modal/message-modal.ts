import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'message-modal',
  styleUrls: ['./message-modal.scss'],
  templateUrl: './message-modal.html',
})
export class MessageModal {

  @Output() onClose = new EventEmitter();
  @Input() messageData;

  private closeModal($event, isAccepted: boolean) {
    this.onClose.emit({ isAccepted });
  }

}

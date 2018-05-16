import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'play-story-modal',
  styleUrls: ['./play-story-modal.scss'],
  templateUrl: './play-story-modal.html'
})
export class PlayStoryModal {

  @Output() onClose = new EventEmitter();

  public closeModal() {
    this.onClose.emit({});
  }
}

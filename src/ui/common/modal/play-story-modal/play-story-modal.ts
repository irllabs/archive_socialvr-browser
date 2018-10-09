import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'play-story-modal',
  styleUrls: ['./play-story-modal.scss'],
  templateUrl: './play-story-modal.html'
})
export class PlayStoryModal {

  @Output() onClose = new EventEmitter();
  
  get isMobile():boolean{
    return typeof window.orientation !== 'undefined'
  }

  public singleScreen() {
    this.onClose.emit({});
  }
  
  public dualScreen () {
    this.onClose.emit({isDualScreen: true })
  }
}

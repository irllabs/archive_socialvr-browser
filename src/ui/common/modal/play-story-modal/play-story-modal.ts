import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'play-story-modal',
  styleUrls: ['./play-story-modal.scss'],
  templateUrl: './play-story-modal.html'
})
export class PlayStoryModal {
  public timer: number
  public isTimerInProgress: boolean = false;

  @Output() onClose = new EventEmitter();

  public closeModal() {
    this.onClose.emit({});
  }
  public closeWithDelay () {
    this.timer = 5
    this.isTimerInProgress = true
    this.onClose.emit({isDualScreen: true })
    let interval = setInterval(() => {
      this.timer--;

      if(this.timer === 0){
        clearInterval(interval)
        this.isTimerInProgress = false
      }
    }, 1000)
  }
}

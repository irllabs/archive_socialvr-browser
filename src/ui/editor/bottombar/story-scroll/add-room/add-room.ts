import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {EventBus} from 'ui/common/event-bus';
import {SceneInteractor} from 'core/scene/sceneInteractor';

@Component({
  selector: 'add-room',
  styleUrls: ['./add-room.scss'],
  templateUrl: './add-room.html'
})
export class AddRoomButton {
  constructor(
    private router: Router,
    private sceneInteractor: SceneInteractor,
    private eventBus: EventBus
  ) {}

  addRoom($event) {
    console.log('addRoom');
    //this.sceneInteractor.addRoom();
    this.router.navigate(['/editor', {outlets: {'modal': 'upload'}}]);
    //this.eventBus.onSelectRoom(null, true);
  }
}

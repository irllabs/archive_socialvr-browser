import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'add-room',
  styleUrls: ['./add-room.scss'],
  templateUrl: './add-room.html'
})
export class AddRoomButton {
  constructor(
    private router: Router
  ) {}

  addRoom($event) {
    this.router.navigate(['/editor', {outlets: {'modal': 'upload'}}]);
  }
}

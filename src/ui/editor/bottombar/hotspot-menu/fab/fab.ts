import {Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'fab',
  styleUrls: ['./fab.scss'],
  templateUrl: './fab.html'
})
export class Fab {

  @Input() isOpen: boolean = false;

}

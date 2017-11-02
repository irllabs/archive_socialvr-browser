import {Component, Input, Output, EventEmitter} from '@angular/core';

import {generateUniqueId} from 'data/util/uuid';


@Component({
  selector: 'file-loader-multi',
  styleUrls: ['./file-loader-multi.scss'],
  templateUrl: './file-loader-multi.html'
})
export class FileLoaderMulti {

  @Output() onFileLoad: EventEmitter<any> = new EventEmitter();
  @Input() displayText: string = 'Drag multiple...'
  private inputId = generateUniqueId();

  private onFileChange($event) {
    this.onFileLoad.emit({files: $event.target.files});
  }

  private onFileDrop($event) {
    this.onFileLoad.emit($event);
  }

}

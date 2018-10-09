import { Component, EventEmitter, Input, Output } from '@angular/core';
import { generateUniqueId } from 'data/util/uuid';

import { EventBus } from 'ui/common/event-bus';
import { FileLoaderUtil } from 'ui/editor/util/fileLoaderUtil';
import { resolve } from 'path';

@Component({
  selector: 'file-loader',
  styleUrls: ['./file-loader.scss'],
  templateUrl: './file-loader.html',
})
export class FileLoader {
  @Output() onFileLoad: EventEmitter<any> = new EventEmitter();
  @Input() acceptedFileType: string;
  @Input() displayText: string = 'Drag File...';
  @Input() maxFileSize: number = null; // in Mb

  private inputId = generateUniqueId();

  constructor(
    private eventBus: EventBus,
    private fileLoaderUtil: FileLoaderUtil,
  ) {
  }

  private onFileChange($event) {
    const file = $event.target.files && $event.target.files[0];

    if (!file) {
      this.eventBus.onModalMessage('Error', 'No valid file selected');
      return;
    }
    
    if (!this.acceptedFileType) {
      console.error('file-loader must have an accepted file type');
      return;
    }

    if (this.maxFileSize !== null && file.size / 1024 / 1024 > this.maxFileSize) {
      this.eventBus.onModalMessage('Error', `File size could not be greater than ${this.maxFileSize}MB`);
      return;
    }

    this.fileLoaderUtil.validateFileLoadEvent(file, this.acceptedFileType)
    .then(this.fileLoaderUtil.getBinaryFileData.bind(this.fileLoaderUtil))
    .then(fileData => {
      this.onFileLoad.emit({
        binaryFileData: fileData,
        file: file,
      });
    })
    .catch(error => this.eventBus.onModalMessage('Error', error));
  }

  private onFileDrop($event) {
    this.onFileLoad.emit($event);
  }

}

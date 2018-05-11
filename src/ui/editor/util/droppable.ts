import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';

import { EventBus } from 'ui/common/event-bus';
import { FileLoaderUtil } from 'ui/editor/util/fileLoaderUtil';

@Directive({
  selector: '[droppable]',
})
export class Droppable {

  @Output() onFileLoad = new EventEmitter();
  @Input() acceptedFileType: string;
  @Input() acceptMultpleFiles: boolean = false;

  //prevent download of unintentionally dropped files
  private static staticConstructor = (() => {
    window.addEventListener('dragover', e => e.preventDefault());
    window.addEventListener('drop', e => e.preventDefault());
  })();

  constructor(
    private eventBus: EventBus,
    private fileLoaderUtil: FileLoaderUtil,
  ) {
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event) {
    event.stopPropagation();
    event.preventDefault();
  }

  @HostListener('drop', ['$event'])
  onDrop(event) {
    event.stopPropagation();
    event.preventDefault();

    if (this.acceptMultpleFiles) {
      this.onFileLoad.emit({
        files: event.dataTransfer.files,
      });
      return;
    }

    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    if (!file) {
      this.eventBus.onModalMessage('Error', 'No valid file selected');
      return;
    }
    if (!this.acceptedFileType) {
      console.error('file-loader must have an accepted file type');
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

}

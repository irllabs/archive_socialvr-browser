import {Component, Input} from '@angular/core';

import {Image} from 'data/scene/entities/image';
import {EventBus} from 'ui/common/event-bus';
import {FileLoader} from 'ui/editor/util/file-loader/file-loader';
import {resizeImage} from 'data/util/imageResizeService';

@Component({
  selector: 'image-editor',
  styleUrls: ['./image-editor.scss'],
  templateUrl: './image-editor.html'
})
export class ImageEditor {

  @Input() imageProperty: Image;

  constructor(private eventBus: EventBus) {}

  private onFileLoad($event) {
    resizeImage($event.binaryFileData, 'hotspotImage')
      .then(resizedImageData => this.imageProperty.setFileData($event.file.name, resizedImageData))
      .catch(error => this.eventBus.onModalMessage('Image loading error', error));
  }

}

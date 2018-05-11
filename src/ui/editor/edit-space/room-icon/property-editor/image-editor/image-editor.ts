import { Component, Input } from '@angular/core';

import { Image } from 'data/scene/entities/image';
import { resizeImage } from 'data/util/imageResizeService';
import { EventBus } from 'ui/common/event-bus';

@Component({
  selector: 'image-editor',
  styleUrls: ['./image-editor.scss'],
  templateUrl: './image-editor.html',
})
export class ImageEditor {

  @Input() imageProperty: Image;

  constructor(private eventBus: EventBus) {
  }

  private onFileLoad($event) {
    resizeImage($event.binaryFileData, 'hotspotImage')
      .then(resizedImageData => this.imageProperty.setFileData($event.file.name, resizedImageData))
      .catch(error => this.eventBus.onModalMessage('Image loading error', error));
  }
}

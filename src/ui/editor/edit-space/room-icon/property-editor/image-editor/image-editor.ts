import {Component, Input, ViewChild} from '@angular/core';

import {Image} from 'data/scene/entities/image';
import {Audio} from 'data/scene/entities/audio';
import {Text} from 'data/scene/entities/text';

import {browserCanRecordAudio} from 'ui/editor/util/audioRecorderService';
import {DEFAULT_FILE_NAME, DEFAULT_VOLUME} from 'ui/common/constants';

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

  // image related
  private onImageFileLoad($event) {
    resizeImage($event.binaryFileData, 'hotspotImage')
      .then(resizedImageData => this.imageProperty.setFileData($event.file.name, resizedImageData))
      .catch(error => this.eventBus.onModalMessage('Image loading error', error));
  }

  // text related
}

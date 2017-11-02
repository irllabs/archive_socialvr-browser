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
  @Input() audioProperty: Audio;
  @Input() textProperty: Text;

  constructor(private eventBus: EventBus) {}

  // image related
  private onImageFileLoad($event) {
    resizeImage($event.binaryFileData, 'hotspotImage')
      .then(resizedImageData => this.imageProperty.setFileData($event.file.name, resizedImageData))
      .catch(error => this.eventBus.onModalMessage('Image loading error', error));
  }

  // audio related
  private onAudioFileLoad($event) {
    this.audioProperty.setFileData($event.file.name, DEFAULT_VOLUME, $event.binaryFileData);
  }

  private hasAudioFile(): boolean {
    return this.audioProperty.getFileName() !== DEFAULT_FILE_NAME;
  }

  private onAudioRecorded($event) {
    this.audioProperty.setFileData($event.fileName, DEFAULT_VOLUME, $event.dataUrl);
  }

  private showAudioRecorder(): boolean {
    return browserCanRecordAudio();
    //return true;
  }

  private onVolumeChange($event) {
    const volume = $event.currentTarget.volume;
    this.audioProperty.setVolume(volume);
  }

  // text related
}

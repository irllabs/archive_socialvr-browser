import {Component, Input, ViewChild} from '@angular/core';

import {DEFAULT_FILE_NAME, DEFAULT_VOLUME} from 'ui/common/constants';
import {Audio} from 'data/scene/entities/audio';
import {browserCanRecordAudio} from 'ui/editor/util/audioRecorderService';


@Component({
  selector: 'audio-editor',
  styleUrls: ['./audio-editor.scss'],
  templateUrl: './audio-editor.html'
})
export class AudioEditor {

  @Input() audioProperty: Audio;

  private onFileLoad($event) {
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
  }

  private onVolumeChange($event) {
    const volume = $event.currentTarget.volume;
    this.audioProperty.setVolume(volume);
  }
}

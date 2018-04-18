import {Component, Input} from '@angular/core';
import {Universal} from 'data/scene/entities/universal';
import {EventBus} from 'ui/common/event-bus';
import {resizeImage} from 'data/util/imageResizeService';
import {DEFAULT_VOLUME} from 'ui/common/constants';
import {browserCanRecordAudio} from 'ui/editor/util/audioRecorderService';


@Component({
  selector: 'universal-editor',
  styleUrls: ['./universal-editor.scss'],
  templateUrl: './universal-editor.html'
})
export class UniversalEditor {

  @Input() universalProperty: Universal;

  public TABS = {
    IMAGE: 1,
    TEXT: 2,
    AUDIO: 3,
  };

  private _activeTab: number = null;

  public get activeTab(): number {
    if (this._activeTab === null) {
      if (this.hasImageContent()) {
        this._activeTab = this.TABS.IMAGE;
      } else if (this.hasTextContent()) {
        this._activeTab = this.TABS.TEXT;
      } else if(this.hasAudioContent()) {
        this._activeTab = this.TABS.AUDIO;
      } else {
        this._activeTab = this.TABS.IMAGE;
      }
    }

    return this._activeTab;
  }

  constructor(private eventBus: EventBus) {
  }

  public onChangeActiveTab(event, tab) {
    if (event.target.checked) {
      this._activeTab = tab;
    }
  }

  public onImageFileLoad($event) {
    resizeImage($event.binaryFileData, 'hotspotImage')
      .then(resizedImageData => this.universalProperty.setImageContent($event.file.name, resizedImageData))
      .catch(error => this.eventBus.onModalMessage('Image loading error', error));
  }

  public onAudioFileLoad($event) {
    this.universalProperty.setAudioContent($event.file.name, $event.binaryFileData, DEFAULT_VOLUME);
  }

  public onVolumeChange($event) {
    this.universalProperty.volume = $event.currentTarget.volume;
  }

  public onAudioRecorded($event) {
    this.universalProperty.setAudioContent($event.fileName, $event.dataUrl, DEFAULT_VOLUME);
  }

  public onLoopChange($event) {
    this.universalProperty.loop = $event.value;
  }

  public getLoopState() {
    return this.universalProperty.loop;
  }

  public hasAudioContent(): boolean {
    return this.universalProperty.audioContent.hasAsset();
  }

  public hasImageContent(): boolean {
    return this.universalProperty.imageContent.hasAsset();
  }

  public hasTextContent(): boolean {
    return !!this.universalProperty.textContent;
  }

  public showAudioRecorder(): boolean {
    return browserCanRecordAudio();
  }
}

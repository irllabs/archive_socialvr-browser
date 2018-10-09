import { Component, Input } from '@angular/core';
import { Universal } from 'data/scene/entities/universal';
import { resizeImage } from 'data/util/imageResizeService';
import { DEFAULT_VOLUME } from 'ui/common/constants';
import { EventBus } from 'ui/common/event-bus';
import { browserCanRecordAudio } from 'ui/editor/util/audioRecorderService';
import { MetaDataInteractor } from '../../../../../../core/scene/projectMetaDataInteractor';
import { audioDuration } from 'ui/editor/util/audioDuration';
import { SettingsInteractor } from 'core/settings/settingsInteractor';

@Component({
  selector: 'universal-editor',
  styleUrls: ['./universal-editor.scss'],
  templateUrl: './universal-editor.html',
})
export class UniversalEditor {

  @Input() universalProperty: Universal;

  private _activeTab: number = null;
  private _originImage: any = null;
  private _rotateImageAngle: number = 0;

  public TABS = {
    IMAGE: 1,
    TEXT: 2,
    AUDIO: 3,
  };

  public get activeTab(): number {
    if (this._activeTab === null) {
      if (this.hasImageContent()) {
        this._activeTab = this.TABS.IMAGE;
      } else if (this.hasTextContent()) {
        this._activeTab = this.TABS.TEXT;
      } else if (this.hasAudioContent()) {
        this._activeTab = this.TABS.AUDIO;
      } else {
        this._activeTab = this.TABS.IMAGE;
      }
    }

    return this._activeTab;
  }

  public get activeTabName(): string {
    switch (this.activeTab) {
      case this.TABS.IMAGE: {
        return 'Image';
      }
      case this.TABS.TEXT: {
        return 'Text';
      }
      default: {
        return 'Audio';
      }
    }
  }

  public get textContent(): string {
    return this.universalProperty.textContent;
  }

  public set textContent(value: string) {
    this.universalProperty.textContent = value;
    this._onChange();
  }

  constructor(
    private eventBus: EventBus,
    private projectMetaDataInteractor: MetaDataInteractor,
    private settingsInteractor: SettingsInteractor
    ) {
  }

  private _onChange() {
    this.projectMetaDataInteractor.onProjectChanged();
  }

  public onNameChange($event) {
    this.universalProperty.setName($event.text);
    this._onChange();
  }

  public onChangeActiveTab(event, tab) {
    if (event.target.checked) {
      this._activeTab = tab;
    }
  }

  public onImageFileLoad($event) {
    resizeImage($event.binaryFileData, 'hotspotImage')
      .then((resizedImageData) => {
        this._originImage = null;

        this.universalProperty.setImageContent(resizedImageData);
        this._onChange();
      })
      .catch(error => this.eventBus.onModalMessage('Image loading error', error));
  }

  public onRotateImage() {
    const image = document.createElement('img');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (this._originImage === null) {
      this._originImage = this.universalProperty.imageContent.getBinaryFileData();
      this._originImage = this._originImage && this._originImage.changingThisBreaksApplicationSecurity ? this._originImage.changingThisBreaksApplicationSecurity : this._originImage;
    }

    this._rotateImageAngle += 90;

    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.translate(image.width / 2, image.height / 2);
      context.rotate(this._rotateImageAngle * Math.PI / 180);
      context.drawImage(image, -image.width / 2, -image.height / 2);
      context.restore();
      this.universalProperty.imageContent.setBinaryFileData(canvas.toDataURL());
    };

    image.src = this._originImage;
    this._onChange();
  }

  public onAudioFileLoad($event) {
    const { maxHotspotAudioDuration} = this.settingsInteractor.settings;
    audioDuration($event.file)
      .then(duration => {
        if (duration > maxHotspotAudioDuration) {
          throw new Error(`Duration of hotspot audio is  too long. It should be less that ${maxHotspotAudioDuration} seconds`)
        }
        this.universalProperty.setAudioContent($event.binaryFileData, DEFAULT_VOLUME);
        this._onChange();
      })
      .catch((error) => this.eventBus.onModalMessage('Error', error))
    
  }

  public onVolumeChange($event) {
    if (this.universalProperty.volume !== $event.currentTarget.volume) {
      this.universalProperty.volume = $event.currentTarget.volume;
      this._onChange();
    }
  }

  public onAudioRecorded($event) {
    this.universalProperty.setAudioContent($event.dataUrl, DEFAULT_VOLUME);
    this._onChange();
  }

  public onLoopChange($event) {
    this.universalProperty.loop = $event.value;
    this._onChange();
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

  public onDeleteTabData(): void {
    switch (this.activeTab) {
      case this.TABS.IMAGE: {
        this.universalProperty.resetImageContent();
        break;
      }
      case this.TABS.TEXT: {
        this.universalProperty.textContent = '';
        break;
      }
      default: {
        this.universalProperty.resetAudioContent();
      }
    }
  }
}

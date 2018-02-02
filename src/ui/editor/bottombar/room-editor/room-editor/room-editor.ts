import {Component, ElementRef, Output, EventEmitter, HostListener} from '@angular/core';

import {Narrator} from 'data/scene/entities/narrator';
import {Audio} from 'data/scene/entities/audio';
import {Room} from 'data/scene/entities/room';
import {MetaDataInteractor} from 'core/scene/projectMetaDataInteractor';
import {resizeImage} from 'data/util/imageResizeService';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {EventBus} from 'ui/common/event-bus';
import {reverbList} from 'data/scene/values/reverbList';
import {browserCanRecordAudio} from 'ui/editor/util/audioRecorderService';

import {DEFAULT_VOLUME, DEFAULT_PROJECT_NAME} from 'ui/common/constants';

@Component({
  selector: 'room-editor',
  styleUrls: ['./room-editor.scss'],
  templateUrl: './room-editor.html'
})
export class RoomEditor {

  @Output() onOffClick = new EventEmitter();
  private reverbOptions = reverbList;

  constructor(
    private sceneInteractor: SceneInteractor,
    private element: ElementRef,
    private eventBus: EventBus,
    private metaDataInteractor: MetaDataInteractor
  ) {}

  @HostListener('document:click', ['$event'])
  private onDocumentClick($event) {
    const isClicked: boolean = this.element.nativeElement.contains(event.target);
    if (!isClicked) {
      this.onOffClick.emit();
    }
  }

  private onBackgroundImageLoad($event) {
    const fileName: string = $event.file.name;
    const binaryFileData: any = $event.binaryFileData;
    this.eventBus.onStartLoading();
    resizeImage(binaryFileData, 'backgroundImage')
      .then(resized => {
        const room = this.getActiveRoom()
        room.setFileData(fileName, resized.backgroundImage);
        room.setThumbnail(fileName, resized.thumbnail);
        this.eventBus.onSelectRoom(null, false);
        this.eventBus.onStopLoading();
      })
      .catch(error => this.eventBus.onModalMessage('Image loading error', error));
  }

  private onBackgroundAudioLoad($event) {
    this.getActiveRoom().setBackgroundAudio($event.file.name, DEFAULT_VOLUME, $event.binaryFileData);
  }

  private onIntroAudioLoad($event) {
    this.getNarratorIntroAudio().setIntroAudio($event.file.name, DEFAULT_VOLUME, $event.binaryFileData);
  }

  private onReturnAudioLoad($event) {
    this.getActiveRoom().getNarrator().setReturnAudio($event.file.name, $event.binaryFileData);
  }

  private getNarratorIntroAudio(): Narrator {
    return this.getActiveRoom().getNarrator();
  }

  private getBackgroundAudio(): Audio {
    return this.getActiveRoom().getBackgroundAudio();
  }

  private getBackgroundAudioVolume(): number {
    return this.getActiveRoom().getBackgroundAudioVolume();
  }

  private getNarratorIntroAudioFile(): Audio {
    return this.getNarratorIntroAudio().getIntroAudio();
  }

  private getNarratorReturnAudio(): Audio {
    return this.getNarratorIntroAudio().getReturnAudio();
  }

  private getActiveRoom(): Room {
    const activeRoomId = this.sceneInteractor.getActiveRoomId();
    return this.sceneInteractor.getRoomById(activeRoomId);
  }

  private onNarratorIntroRecorded($event) {
    this.getActiveRoom().getNarrator().setIntroAudio($event.fileName, DEFAULT_VOLUME, $event.dataUrl);

  }

  private onNarratorReturnRecorded($event) {
    this.getActiveRoom().getNarrator().setReturnAudio($event.fileName, $event.dataUrl);
  }

  private onReverbChange($event) {
    this.getActiveRoom().setReverb($event.target.value);
  }

  private getActiveReverb(): string {
    return this.getActiveRoom().getReverb();
  }

  private removeBackgroundAudio() {
    this.getActiveRoom().removeBackgroundAudio();
  }

  private removeNarratorIntroAudio() {
    this.getNarratorIntroAudio().removeIntroAudio();
  }

  private showAudioRecorder(): boolean {
    return browserCanRecordAudio();
  }

  private onNarrationVolumeChange($event) {
    const volume = $event.currentTarget.volume;
    this.getNarratorIntroAudio().setVolume(volume);
  }

  private onBGAVolumeChange($event) {
    const volume = $event.currentTarget.volume;
    this.getActiveRoom().setBackgroundAudioVolume(volume);
  }

  private getRoomName(): string {
    const roomId = this.sceneInteractor.getActiveRoomId();
    const room =  this.sceneInteractor.getRoomById(roomId);
    return room.getName();
  }

  private setRoomName($event) {
    const roomId = this.sceneInteractor.getActiveRoomId();
    const room =  this.sceneInteractor.getRoomById(roomId);
    room.setName($event.text);
  }



}

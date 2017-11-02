import {Component, Output, EventEmitter} from '@angular/core';

import {EventBus} from 'ui/common/event-bus';
import {FileLoaderUtil} from 'ui/editor/util/fileLoaderUtil';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {Room} from 'data/scene/entities/room';
import {resizeImage} from 'data/util/imageResizeService';


@Component({
  selector: 'default-overlay',
  styleUrls: ['./default-overlay.scss'],
  templateUrl: './default-overlay.html'
})
export class DefaultOverlay {

  @Output() onFileLoad = new EventEmitter();

  constructor(
    private eventBus: EventBus,
    private fileLoaderUtil: FileLoaderUtil,
    private sceneInteractor: SceneInteractor
    //private backgroundArray: any

  ) {}

  /*
  private selectBackground () {
    this.backgroundArray = new Aarry(
      'url("assets/images/background_baseball.JPG',
      'url("assets/images/background_bosnia-waterfall.JPG',
      'url("assets/images/background_clothing.jpg');
    const pickOne = Math.round(Math.random()*100)%3;
    header.css('background-image', this.backgroundArray[pickOne]);
  );
  }

  */

  private onFileChange($event) {
    const file = $event.target.files && $event.target.files[0];
    if (!file) {
      this.eventBus.onModalMessage('Error', 'No valid file selected');
      return;
    }
    this.eventBus.onStartLoading();
    this.fileLoaderUtil.validateFileLoadEvent(file, 'image')
      .then(this.fileLoaderUtil.getBinaryFileData.bind(this.fileLoaderUtil))
      .then(fileData => resizeImage(fileData, 'backgroundImage'))
      .then(resized => {
        const roomId: string = this.sceneInteractor.getActiveRoomId();
        const room: Room = this.sceneInteractor.getRoomById(roomId);
        room.setFileData(file.name, resized.backgroundImage);
        room.setThumbnail(file.name, resized.thumbnail);
        if (this.onFileLoad) {
          this.onFileLoad.emit();
        }
        this.eventBus.onStopLoading();
      })
      .catch(error => this.eventBus.onModalMessage('Error', error));
  }

}

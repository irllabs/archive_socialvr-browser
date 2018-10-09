import { Component, EventEmitter, Output } from '@angular/core';
import { SceneInteractor } from 'core/scene/sceneInteractor';
import { Room } from 'data/scene/entities/room';
import { resizeImage } from 'data/util/imageResizeService';
import { EventBus } from 'ui/common/event-bus';
import { FileLoaderUtil, mimeTypeMap } from 'ui/editor/util/fileLoaderUtil';
import { SlideshowBuilder } from 'ui/editor/util/SlideshowBuilder';
import { ZipFileReader } from 'ui/editor/util/zipFileReader';
import { SettingsInteractor } from 'core/settings/settingsInteractor'


@Component({
  selector: 'default-overlay',
  styleUrls: ['./default-overlay.scss'],
  templateUrl: './default-overlay.html',
})
export class DefaultOverlay {

  @Output() onFileLoad = new EventEmitter();

  constructor(
    private eventBus: EventBus,
    private fileLoaderUtil: FileLoaderUtil,
    private zipFileReader: ZipFileReader,
    private sceneInteractor: SceneInteractor,
    private slideshowBuilder: SlideshowBuilder,
    private settingsInteractor: SettingsInteractor
  ) {
  }

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

  public onFileDrop(event) {
    if (event.files && event.files.length > 1) {
      this.eventBus.onStartLoading();
      this.slideshowBuilder.build(event.files)
        .then(resolve => {
          this.eventBus.onStopLoading();
        })
        .catch(error => this.eventBus.onModalMessage('error', error));
      return;
    }
    const file = event.files[0];
    if (mimeTypeMap.image.indexOf(file.type) > -1) {
      this.loadImageFile(file);
    } else if (mimeTypeMap.zip.indexOf(file.type) > -1) {
      this.loadZipFile(file);
    }
  }

  public onFileChange($event) {
    const file = $event.target.files && $event.target.files[0];
    const files = $event.target.files;

    if (!file) {
      this.eventBus.onModalMessage('Error', 'No valid file selected');
      return;
    }

    if ($event.target.files.length > 1) {
      this.addSlideshow(files);
    } else if (mimeTypeMap.image.indexOf(file.type) > -1) {
      this.loadImageFile(file);
    } else if (mimeTypeMap.zip.indexOf(file.type) > -1) {
      this.loadZipFile(file);
    }
  }

  private loadImageFile(file) {
    const { maxBackgroundImageSize } = this.settingsInteractor.settings
    
    if(file.size/1024/1024 >= maxBackgroundImageSize){
      this.eventBus.onModalMessage('Error', `File is too large. Max file size is ${maxBackgroundImageSize} mb`)
      return;
    }

    this.eventBus.onStartLoading();
    this.fileLoaderUtil.validateFileLoadEvent(file, 'image')
      .then(this.fileLoaderUtil.getBinaryFileData.bind(this.fileLoaderUtil))
      .then(fileData => resizeImage(fileData, 'backgroundImage'))
      .then((resized) => {
        const roomId: string = this.sceneInteractor.getActiveRoomId();
        const room: Room = this.sceneInteractor.getRoomById(roomId);

        room.setBackgroundImageBinaryData(resized.backgroundImage);
        room.setThumbnail(resized.thumbnail);

        if (this.onFileLoad) {
          this.onFileLoad.emit();
        }
        this.eventBus.onStopLoading();
      })
      .catch(error => this.eventBus.onModalMessage('Error', error));
  }

  private addSlideshow(files) {
    this.eventBus.onStartLoading();
    this.slideshowBuilder.build(files)
      .then(resolve => this.eventBus.onStopLoading())
      .catch(error => this.eventBus.onModalMessage('error', error));
  }

  private loadZipFile(file) {
    this.zipFileReader.loadFile(file);
  }

}

import {Component, Output, EventEmitter} from '@angular/core';
import {EventBus} from 'ui/common/event-bus';
import {FileLoaderUtil, mimeTypeMap} from 'ui/editor/util/fileLoaderUtil';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {Room} from 'data/scene/entities/room';
import {resizeImage} from 'data/util/imageResizeService';
import {ZipFileReader} from 'ui/editor/util/zipFileReader';
import {SlideshowBuilder} from 'ui/editor/util/SlideshowBuilder';
import {FileLoaderMulti} from 'ui/editor/util/file-loader-multi/file-loader-multi';


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
    private zipFileReader: ZipFileReader,
    private sceneInteractor: SceneInteractor,
    private slideshowBuilder: SlideshowBuilder
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

  private onFileDrop(event) {
    console.log("onFileDrop: ", event);
    if (event.files && event.files.length > 1) {
      this.eventBus.onStartLoading();
      this.slideshowBuilder.build(event.files)
        .then(resolve => {
          this.eventBus.onStopLoading();
        })
        .catch(error => this.eventBus.onModalMessage('error', error));
      return;
    }


  }

  private onFileChange($event) {
    const file = $event.target.files && $event.target.files[0];
    const files = $event.target.files;

    console.log('adding multi 1: ', $event.target.files);
    if (!file) {
      this.eventBus.onModalMessage('Error', 'No valid file selected');
      return;
    }
    //console.log("hi: ",file);
    if ($event.target.files.length > 1 ) {
      console.log('adding multi 2');
      this.addSlideshow(files);
    } else if (mimeTypeMap.image.indexOf(file.type)>-1) {
      this.loadImageFile(file);
    } else if (mimeTypeMap.zip.indexOf(file.type)>-1) {
      this.loadZipFile(file);
    }
  }

  private loadImageFile(file ) {
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

  private addSlideshow(files) {
    this.eventBus.onStartLoading();
    this.slideshowBuilder.build(files)
      .then(resolve => this.eventBus.onStopLoading())
      .catch(error => this.eventBus.onModalMessage('error', error));
  }

  private loadZipFile (file) {
    this.zipFileReader.loadFile(file);
  }

}

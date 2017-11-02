import {Component, Output, EventEmitter, HostListener,  ViewChild,} from '@angular/core';
import {Router} from '@angular/router';
import {EventBus} from 'ui/common/event-bus';
import {FileLoaderUtil} from 'ui/editor/util/fileLoaderUtil';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {Room} from 'data/scene/entities/room';
import {resizeImage} from 'data/util/imageResizeService';
//added by ali for dragging images in
import {SlideshowBuilder} from 'ui/editor/util/SlideshowBuilder';
import {VideoInteractor} from 'core/video/VideoInteractor';
import {normalizeAbsolutePosition} from 'ui/editor/util/iconPositionUtil';
import {mimeTypeMap} from 'ui/editor/util/fileLoaderUtil';
import {Audio} from 'data/scene/entities/audio';
import {Image} from 'data/scene/entities/image';
import {Vector2} from 'data/scene/entities/vector2';
import {ZipFileReader} from 'ui/editor/util/zipFileReader';

@Component({
  selector: 'upload',
  styleUrls: ['./upload.scss'],
  templateUrl: './upload.html'
})
export class Upload {

  @ViewChild('editSpaceSphere') editSpaceSphere;
  @Output() onFileLoad = new EventEmitter();

  constructor(
    private router: Router,
    private eventBus: EventBus,
    private fileLoaderUtil: FileLoaderUtil,
    private slideshowBuilder: SlideshowBuilder,
    private sceneInteractor: SceneInteractor,
    private videoInteractor: VideoInteractor,
    private zipFileReader: ZipFileReader
  ) {}


  @HostListener('drop', ['$event'])
  onDrop(event) {

      event.stopPropagation();
      event.preventDefault();

      // At the moment, only deal with multiple background images
      // TODO: enable dragging in multiple files for hotspots as well
      //if (event.dataTransfer.files && event.dataTransfer.files.length > 1) {
        this.eventBus.onStartLoading();
        this.slideshowBuilder.build(event.dataTransfer.files)
          .then(resolve => {
            this.eventBus.onStopLoading();
            this.requestRender();
          })
          .catch(error => this.eventBus.onModalMessage('error', error));
      //  return;
      //}

      const file = event.dataTransfer.files && event.dataTransfer.files[0];
      if (!file) {
        return;
      }


  }


  private onFileChange($event) {
    const file = $event.target.files && $event.target.files[0];
    if (!file) {
      this.eventBus.onModalMessage('Error', 'No valid file selected');
      return;
    }
    this.eventBus.onStartLoading();
    this.router.navigate(['/editor', {outlets: {'modal': null}}]);
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

      this.router.navigate(['/editor', {outlets: {'modal': null}}]);
  }

  onOffClick($event) {
    //console.log('onOffClick user-tab');
    if (!$event.isOffClick) return;
    this.router.navigate(['/editor', {outlets: {'modal': ''}}]);
  }

  //added by ali for dropping background images
  private requestRender() {
    if (this.isFlat()) return;
    setTimeout(() => {
      this.editSpaceSphere.render();
    });
  }

  private processDroppedFile(file: any, x: number, y: number) {
    const fileName: string = file.name;
    const dropPosition: Vector2 = this.isFlat() ?
        normalizeAbsolutePosition(x, y) :
        this.editSpaceSphere.transformScreenPositionTo3dNormal(x, y);

    const fileType: string = Object.keys(mimeTypeMap)
      .find(fileType => mimeTypeMap[fileType].indexOf(file.type) > -1);

    if (!fileType) {
      const errorTitle: string = 'Incompatible File Type';
      const errorMessage: string = 'Try using an image (.jpg, .jpeg, .png), an audio file (.mp3, .wav), or a story file (.zip)';
      this.eventBus.onModalMessage(errorTitle, errorMessage);
      return;
    }

    if (fileType === 'video') {
      console.log('bam, video', file);
      this.getFileTypeStrategy(fileType)(file, null, dropPosition);
      return;
      //this.getFileTypeStrategy(fileType)(file, binaryFileData, dropPosition))
    }

    this.fileLoaderUtil.getBinaryFileData(file)
      .then(binaryFileData => this.getFileTypeStrategy(fileType)(file, binaryFileData, dropPosition))
      .catch(error => this.eventBus.onModalMessage('Error', error));
  }


    private isFlat(): boolean {
      return this.router.url.includes('view:flat');
    }

    private getFileTypeStrategy(fileType: string) {
      const fileTypeStrategy = {

        audio: (file, binaryFileData, position) => {
          const activeRoomId: string = this.sceneInteractor.getActiveRoomId();
          const audio: Audio = this.sceneInteractor.addAudio(activeRoomId);
          audio.setFileName(file.name);
          audio.setBinaryFileData(binaryFileData);
          audio.setLocation(position);
          this.requestRender();
        },

        image: (file, binaryFileData, position) => {
          const activeRoomId: string = this.sceneInteractor.getActiveRoomId();
          if (!this.hasBackgroundImage()) {
            this.eventBus.onStartLoading();
            resizeImage(binaryFileData, 'backgroundImage')
              .then(resized => {
                const room: Room = this.sceneInteractor.getRoomById(activeRoomId);
                room.setFileData(file.name, resized.backgroundImage);
                room.setThumbnail(file.name, resized.thumbnail);
                this.requestRender();
                this.eventBus.onStopLoading();
              })
              .catch(error => this.eventBus.onModalMessage('Image loading error', error));
            return;
          }

          resizeImage(binaryFileData, 'hotspotImage')
            .then(resizedImageData => {
              const image: Image = this.sceneInteractor.addImage(activeRoomId);
              image.setFileName(file.name);
              image.setBinaryFileData(resizedImageData);
              image.setLocation(position);
              this.requestRender();
            })
            .catch(error => this.eventBus.onModalMessage('Image loading error', error));

        },

        zip: (file, binaryFileData, position) => {
          this.zipFileReader.loadFile(file);
          //TODO: set as read - write
        },

        video: (file, binaryFileData, position) => {
          // const activeRoomId: string = this.sceneInteractor.getActiveRoomId();
          // const room: Room = this.sceneInteractor.getRoomById(activeRoomId);
          // room.setFileData(file.name, binaryFileData);
          // room.setBackgroundIsVideo(true);
          this.videoInteractor.uploadVideo(file)
            .subscribe(
              data => {
                const activeRoomId: string = this.sceneInteractor.getActiveRoomId();
                const room: Room = this.sceneInteractor.getRoomById(activeRoomId);
                room.setBackgroundVideo('', data.downloadUrl);
                console.log('bam, success', data);
              },
              error => console.log('damn', error)
            );
        }

      };
      return fileTypeStrategy[fileType];
    }

    private hasBackgroundImage(): boolean {
      const activeRoomId: string  = this.sceneInteractor.getActiveRoomId();
      return this.sceneInteractor.roomHasBackgroundImage(activeRoomId);
    }

}

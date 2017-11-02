import {
  Component,
  Input,
  ViewChild,
  HostListener,
  ElementRef
} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';

import {FileLoaderUtil, mimeTypeMap} from 'ui/editor/util/fileLoaderUtil';
import {EventBus, EventType} from 'ui/common/event-bus';
import {normalizeAbsolutePosition} from 'ui/editor/util/iconPositionUtil';
import {SHARED_KEY} from 'ui/editor/util/publicLinkHelper';
import {ZipFileReader} from 'ui/editor/util/zipFileReader';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {VideoInteractor} from 'core/video/VideoInteractor';
import {RoomProperty} from 'data/scene/interfaces/RoomProperty';
import {Audio} from 'data/scene/entities/audio';
import {Image} from 'data/scene/entities/image';
import {Room} from 'data/scene/entities/room';
import {Vector2} from 'data/scene/entities/vector2';
import {resizeImage} from 'data/util/imageResizeService';
import {SlideshowBuilder} from 'ui/editor/util/SlideshowBuilder';
import {ShareableLoader} from 'ui/common/shareable-loader';
import {MetaDataInteractor} from 'core/scene/projectMetaDataInteractor';
import {addTouchListenersToElement} from 'ui/editor/util/touchUtil';
import {ResponsiveUtil} from 'ui/editor/util/responsiveUtil';

@Component({
  selector: 'editor',
  styleUrls: ['./editor.scss'],
  templateUrl: './editor.html'
})
export class Editor {

  @ViewChild('editSpaceSphere') editSpaceSphere;
  private hotspotMenuIsOpen: boolean = false;
  private hotspotEditorIsOpen: boolean = false;
  protected subscriptions: Set<Subscription> = new Set<Subscription>();
  private isInFlatMode: boolean = true;
  private isInFullscreen: boolean = false;

  constructor(
    private sceneInteractor: SceneInteractor,
    private fileLoaderUtil: FileLoaderUtil,
    private eventBus: EventBus,
    private zipFileReader: ZipFileReader,
    private slideshowBuilder: SlideshowBuilder,
    private videoInteractor: VideoInteractor,
    private route: ActivatedRoute,
    private router: Router,
    private shareableLoader: ShareableLoader,
    private metaDataInteractor: MetaDataInteractor,
    private element: ElementRef,
    private responsiveUtil: ResponsiveUtil
  ) {}

  ngAfterViewInit() {
    this.route.queryParams
      .map(params => params[SHARED_KEY])
      .filter(value => !!value)
      .subscribe(
        sharableValue => {
          setTimeout(() => this.shareableLoader.openProject(sharableValue))
        },
        error => console.log('error', error)
      );
    addTouchListenersToElement(this.element.nativeElement);
    this.subscribeToEvents();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event) {
    event.stopPropagation();
    event.preventDefault();
  }

  @HostListener('drop', ['$event'])
  onDrop(event) {
    if (!this.uploadIsOpen()) {
      event.stopPropagation();
      event.preventDefault();

      // At the moment, only deal with multiple background images
      // TODO: enable dragging in multiple files for hotspots as well

      // disabled by ali; to add rooms,
      //drag images to the story-scroll, or click the + to open the upload modal
      // if (event.dataTransfer.files && event.dataTransfer.files.length > 1) {
      //   this.eventBus.onStartLoading();
      //   this.slideshowBuilder.build(event.dataTransfer.files)
      //     .then(resolve => {
      //       this.eventBus.onStopLoading();
      //       this.requestRender();
      //     })
      //     .catch(error => this.eventBus.onModalMessage('error', error));
      //   return;
      // }
      //
      const file = event.dataTransfer.files && event.dataTransfer.files[0];
      if (!file) {
        return;
      }
      this.processDroppedFile(file, event.clientX, event.clientY);
    }
  }

  //added by alik to handle multiple hotspot making
  // private buildHotspots(files): Promise<any> {
  //
  //     const fileList = Object.keys(files)
  //       .map(key => files[key])
  //       .sort((a, b) => a.lastModified - b.lastModified);
  //
  //     return this.processDroppedFile(fileList, event.clientX, event.clientY);
  //
  // }

  private subscribeToEvents() {
    const subscription = this.eventBus.getObservable(EventType.HOTSPOT_EDITOR_VISIBILITY)
      .subscribe(
        event => this.hotspotEditorIsOpen = event.isVisible,
        error => console.log('error', error)
      );
    this.subscriptions.add(subscription);
  }

  private isPreview(): boolean {
    return this.router.url.includes('view:preview');
  }

  private isFlat(): boolean {
    return this.router.url.includes('view:flat');
  }

  private hotspotMenuIsVisible(): boolean {
    if (this.responsiveUtil.isMobile()) {
      return this.hasBackgroundImage()
        && !this.isPreview()
        && !this.hotspotEditorIsOpen;
    }
    return this.hasBackgroundImage()
      && !this.isPreview();
  }

  private viewToggleIsVisible(): boolean {
    if (this.responsiveUtil.isMobile()) {
      return this.hasBackgroundImage()
        && !this.hotspotMenuIsOpen
        && !this.hotspotEditorIsOpen;
    }
    return this.hasBackgroundImage();
  }

  private roomEditorIsVisible(): boolean {
    if (this.responsiveUtil.isMobile()) {
      return this.hasBackgroundImage()
        && !this.isPreview()
        && !this.hotspotMenuIsOpen
        && !this.hotspotEditorIsOpen;
    }
    return this.hasBackgroundImage()
      && !this.isPreview();
  }

  private onHotspotMenuChange($event) {
    this.hotspotMenuIsOpen = $event.isOpen;
  }

  private hasBackgroundImage(): boolean {
    const activeRoomId: string  = this.sceneInteractor.getActiveRoomId();
    return this.sceneInteractor.roomHasBackgroundImage(activeRoomId);
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

  //made by ali to handle multiple hotspot creation
  private processDroppedFileMulti(file: any, x: number, y: number): Promise<any> {
    const fileName: string = file.name;
    const dropPosition: Vector2 = this.isFlat() ?
        normalizeAbsolutePosition(x, y) :
        this.editSpaceSphere.transformScreenPositionTo3dNormal(x, y);
    return Promise.all(fileName)
    .then() => {
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

  private requestRender() {
    if (this.isFlat()) return;
    setTimeout(() => {
      this.editSpaceSphere.render();
    });
  }

  private setEditPlaySliderIsVisible(): boolean {
    return false;
  }


  private uploadIsOpen(): boolean {
    var uploadIsVisible = this.router.url.includes('modal:upload');
    console.log("uploadIsVisible: ", uploadIsVisible);
    return uploadIsVisible;
  }

  private editorIsSphere(): boolean {
    return this.router.url.includes('view:sphere');
  }

  private editorIsFlat(): boolean {
    return this.router.url.includes('view:flat');
  }

  private on2dViewClick($event) {
    this.router.navigate(['/editor', {outlets: {'view': 'flat'}}]);
    this.isInFlatMode = true;
    }

  private on3dViewClick($event) {
    this.router.navigate(['editor', {outlets: {'view': 'sphere'}}]);
    this.isInFlatMode = false;
  }

  private onEditPlayChange($event) {
    if ($event.value == 1) {
      this.router.navigate(['editor', {outlets: {'view': 'preview'}}]);
    } else {
      if (this.isInFlatMode){
        this.router.navigate(['/editor', {outlets: {'view': 'flat'}}]);
      } else {
        this.router.navigate(['/editor', {outlets: {'view': 'sphere'}}]);
      }
    }
  }

}

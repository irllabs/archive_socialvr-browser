import { Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MetaDataInteractor } from 'core/scene/projectMetaDataInteractor';
import { SceneInteractor } from 'core/scene/sceneInteractor';
import { VideoInteractor } from 'core/video/VideoInteractor';
import { Room } from 'data/scene/entities/room';
import { Universal } from 'data/scene/entities/universal';
import { Vector2 } from 'data/scene/entities/vector2';
import { resizeImage } from 'data/util/imageResizeService';
import { Subscription } from 'rxjs/Subscription';
import { EventBus, EventType } from 'ui/common/event-bus';
import { ShareableLoader } from 'ui/common/shareable-loader';

import { EditSpaceSphere } from 'ui/editor/edit-space/edit-space-sphere/edit-space-sphere';
import { FileLoaderUtil, mimeTypeMap } from 'ui/editor/util/fileLoaderUtil';
import { normalizeAbsolutePosition } from 'ui/editor/util/iconPositionUtil';
import { SHARED_KEY } from 'ui/editor/util/publicLinkHelper';
import { ResponsiveUtil } from 'ui/editor/util/responsiveUtil';
import { SlideshowBuilder } from 'ui/editor/util/SlideshowBuilder';
import { ZipFileReader } from 'ui/editor/util/zipFileReader';

@Component({
  selector: 'editor',
  styleUrls: ['./editor.scss'],
  templateUrl: './editor.html',
})
export class Editor {

  @Output() changeEmitter = new EventEmitter();
  private hotspotMenuIsOpen: boolean = false;
  private hotspotEditorIsOpen: boolean = false;
  protected subscriptions: Set<Subscription> = new Set<Subscription>();
  private isInFlatMode: boolean = true;
  private isInFullscreen: boolean = false;
  private topCenterButtonsInvisible: boolean = true;
  private editSpaceSphere: EditSpaceSphere;

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
    private responsiveUtil: ResponsiveUtil,
  ) {
  }

  ngAfterViewInit() {
    this.route.queryParams
      .map(params => params[SHARED_KEY])
      .filter(value => !!value)
      .subscribe(
        sharableValue => {
          setTimeout(() => this.shareableLoader.openProject(sharableValue));
        },
        error => console.log('error', error),
      );
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
      //console.log('in onDrop');
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

      const fileList = event.dataTransfer.files;
      if (!fileList) {
        return;
      }
      const files = Object.keys(fileList).map(key => fileList[key]);
      this.processDroppedFileMulti(files, event.clientX, event.clientY);
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
        error => console.log('error', error),
      );
    this.subscriptions.add(subscription);
  }

  private isPreview(): boolean {
    return this.router.url.includes('view:preview');
  }

  private showPreviewCheckbox(): boolean {
    return ((this.roomEditorIsVisible() ||
      this.isPreview()) &&
      !this.isReadOnly());
  }

  private isFlat(): boolean {
    return this.router.url.includes('view:flat');
  }

  private onViewSpaceActivate(componentRef) {
    if (componentRef instanceof EditSpaceSphere) {
      this.editSpaceSphere = componentRef;
    }
    else {
      this.editSpaceSphere = null;
    }
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

  private previewVisible(): boolean {
    return !this.metaDataInteractor.getIsReadOnly();
  }

  private isReadOnly(): boolean {
    return this.metaDataInteractor.getIsReadOnly();
  }

  private viewToggleIsVisibleOLD(): boolean {
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

  private topCenterButtonsClass(): string {
    console.log('what to do');
    if (this.roomEditorIsVisible()
      && this.hasBackgroundImage()) {
      return 'editor_center1';
    } else {
      return 'editor_center';
    }
  }

  private onHotspotMenuChange($event) {
    this.hotspotMenuIsOpen = $event.isOpen;
  }

  private hasBackgroundImage(): boolean {
    const activeRoomId: string = this.sceneInteractor.getActiveRoomId();
    return this.sceneInteractor.roomHasBackgroundImage(activeRoomId);
  }

  //made by ali to handle multiple hotspot creation
  private processDroppedFileMulti(files: any[], x: number, y: number) {
    if (this.isPreview()) {
      console.log('cannot import files in preview mode');
      return;
    }

    //this.eventBus.onStartLoading();
    const filePromises = files.map(file => {
      const dropPosition: Vector2 = this.isFlat() ?
        normalizeAbsolutePosition(x, y) :
        this.editSpaceSphere.transformScreenPositionTo3dNormal(x, y);

      if (!this.isFlat()) {
        dropPosition.setY(-1 * dropPosition.getY());
      }

      const fileType: string = Object.keys(mimeTypeMap)
        .find(fileType => mimeTypeMap[fileType].indexOf(file.type) > -1);

      if (!fileType) {
        const errorMessage: string = 'Try using an image (.jpg, .jpeg, .png), an audio file (.mp3, .wav), or a story file (.zip)';

        return Promise.reject(errorMessage);
      }

      if (fileType === 'video') {
        this.getFileTypeStrategy(fileType)(file, null, dropPosition);

        return;
      }

      return this.fileLoaderUtil.getBinaryFileData(file)
        .then(binaryFileData => {
          this.getFileTypeStrategy(fileType)(file, binaryFileData, dropPosition);
          return Promise.resolve();
        })
        .catch(error => this.eventBus.onModalMessage('Error', error));
    });

    Promise.all(filePromises)
      .then(allDone => {
        //this.eventBus.onStopLoading();
        //console.log('all hotspots are now loaded');
      })
      .catch(error => {
        this.eventBus.onStopLoading();
        this.eventBus.onModalMessage('error', error);
        console.log(error);
      });
  }

  private getFileTypeStrategy(fileType: string) {
    const fileTypeStrategy = {

      audio: (file, binaryFileData, position) => {
        const activeRoomId: string = this.sceneInteractor.getActiveRoomId();
        const universal: Universal = this.sceneInteractor.addUniversal(activeRoomId);

        universal.setAudioContent(file.name, binaryFileData);
        universal.setLocation(position);

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
            const universal: Universal = this.sceneInteractor.addUniversal(activeRoomId);

            universal.setImageContent(file.name, resizedImageData);
            universal.setLocation(position);

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
            },
            error => console.log('damn', error),
          );
      },

    };
    return fileTypeStrategy[fileType];
  }

  private requestRender() {
    if (this.isFlat()) return;
    setTimeout(() => this.editSpaceSphere.render());
  }

  private setEditPlaySliderIsVisible(): boolean {
    return false;
  }

  private uploadIsOpen(): boolean {
    return this.router.url.includes('modal:upload');
  }

  private editorIsSphere(): boolean {
    return this.router.url.includes('view:sphere');
  }

  private editorIsFlat(): boolean {
    return this.router.url.includes('view:flat');
  }

  private on2d3dViewClick($event) {
    if ($event.value) {
      this.on3dViewClick($event);
    } else {
      this.on2dViewClick($event);
    }
  }

  private on2dViewClick($event) {
    this.router.navigate(['/editor', { outlets: { 'view': 'flat' } }]);
    this.isInFlatMode = true;
  }

  private on3dViewClick($event) {
    this.router.navigate(['editor', { outlets: { 'view': 'sphere' } }]);
    this.isInFlatMode = false;
  }


  private onEditPlayChange($event) {
    //this.eventBus.onStartLoading();
    if ($event.value == 1) {
      //console.log('switch to preview');
      this.router.navigate(['editor', { outlets: { 'view': 'preview' } }]);
    } else {
      if (this.isInFlatMode) {
        this.router.navigate(['/editor', { outlets: { 'view': 'flat' } }]);
      } else {
        this.router.navigate(['/editor', { outlets: { 'view': 'sphere' } }]);
      }
    }
    this.changeEmitter.emit({ value: $event.value });
  }

}

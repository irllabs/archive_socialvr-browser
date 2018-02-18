import {Component, Output, EventEmitter, ElementRef, HostListener,  ViewChild,} from '@angular/core';
import {Router} from '@angular/router';
import {EventBus} from 'ui/common/event-bus';
import {FileLoaderUtil} from 'ui/editor/util/fileLoaderUtil';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {Room} from 'data/scene/entities/room';
import {resizeImage} from 'data/util/imageResizeService';
//added by ali for dragging images in
import {SlideshowBuilder} from 'ui/editor/util/SlideshowBuilder';
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
  private isBeingInstantiated: boolean = false;

  constructor(
    private router: Router,
    private eventBus: EventBus,
    private fileLoaderUtil: FileLoaderUtil,
    private slideshowBuilder: SlideshowBuilder,
    private sceneInteractor: SceneInteractor,
    private zipFileReader: ZipFileReader,
    private element: ElementRef
  ) {}

  @HostListener('drop', ['$event'])
  onDrop(event) {
      event.stopPropagation();
      event.preventDefault();
      const file = event.dataTransfer.files && event.dataTransfer.files[0];
      if (!file) { return; }
      if (event.dataTransfer.files && event.dataTransfer.files.length > 1) {
        this.loadSlideshow(event.dataTransfer.files);
        return;
      }
      this.loadBackgroundImage(file);
  }

  @HostListener('document:click', ['$event'])
  private onDocuentClick($event) {
    const isClicked: boolean = this.element.nativeElement.contains(event.target);
    if (this.isBeingInstantiated) {
      this.isBeingInstantiated = false;
      return;
    }
    if (!isClicked) {
      this.router.navigate(['/editor', {outlets: {'modal': null}}]);
    }
  }

  ngOnInit() {
    this.isBeingInstantiated = true;
  }

  private onFileChange($event) {
    const file = $event.target.files && $event.target.files[0];
    if (!file) {
      this.eventBus.onModalMessage('Error', 'No valid file selected');
      return;
    }
    if ($event.target.files && $event.target.files.length > 1) {
      this.loadSlideshow($event.target.files);
      return;
    }
    this.loadBackgroundImage(file);
  }

  private loadBackgroundImage(file) {
    this.router.navigate(['/editor', {outlets: {'modal': null}}]);
    this.eventBus.onStartLoading();
    this.fileLoaderUtil.validateFileLoadEvent(file, 'image')
      .then(this.fileLoaderUtil.getBinaryFileData.bind(this.fileLoaderUtil))
      .then(fileData => resizeImage(fileData, 'backgroundImage'))
      .then(resized => {
        const roomId: string = this.sceneInteractor.addRoom();
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

  private loadSlideshow(files) {
    this.eventBus.onStartLoading();
    this.slideshowBuilder.build(files)
      .then(resolve => {
        this.eventBus.onStopLoading();
      })
      .catch(error => this.eventBus.onModalMessage('error', error));
  }

}

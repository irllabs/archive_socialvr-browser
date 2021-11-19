import {Component} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';

import {EventBus, EventType} from 'ui/common/event-bus';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {MetaDataInteractor} from 'core/scene/projectMetaDataInteractor';
import {RoomProperty} from 'data/scene/interfaces/roomProperty';
import {Room} from 'data/scene/entities/room';
import {resizeImage} from 'data/util/imageResizeService';
import {SlideshowBuilder} from 'ui/editor/util/slideshowBuilder';

@Component({
  selector: 'story-scroll',
  styleUrls: ['./story-scroll.scss'],
  templateUrl: './story-scroll.html'
})
export class StoryScroll {

  private projectIsSelected: boolean = true;
  private activeProperty: RoomProperty;
  private subscriptions: Set<Subscription> = new Set<Subscription>();
  private activeRoomIsExpanded: boolean = true;
  private inspectorIsVisible: boolean = false;
  private isOpen: boolean = false;

  constructor(
    private sceneInteractor: SceneInteractor,
    private metaDataInteractor: MetaDataInteractor,
    private eventBus: EventBus,
    private slideshowBuilder: SlideshowBuilder
  ) {}

  ngOnInit() {
    this.subscribeToEvents();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private subscribeToEvents() {
    const roomPropertySubscription: Subscription = this.eventBus.getObservable(EventType.SELECT_PROPERTY)
      .subscribe(
        observedData => {
          const propertyId: string = observedData.propertyId;
          const activeRoomId: string = this.sceneInteractor.getActiveRoomId();
          this.activeProperty =
            this.sceneInteractor.getPropertyById(activeRoomId, propertyId) ||
            this.sceneInteractor.getRoomById(activeRoomId);
          this.projectIsSelected = false;
          this.activeRoomIsExpanded = true;
        },
        error => console.log('error', error)
      );

    const roomSubscription: Subscription = this.eventBus.getObservable(EventType.SELECT_ROOM)
      .subscribe(
        observedData => {
          const activeRoomId = this.sceneInteractor.getActiveRoomId();
          this.activeProperty = this.sceneInteractor.getRoomById(activeRoomId);
          this.projectIsSelected = false;
        },
        error => console.log('error', error)
      );

    this.subscriptions.add(roomPropertySubscription);
    this.subscriptions.add(roomSubscription);
  }

  onProjectSelect() {
    this.projectIsSelected = true;
  }

  getPropertyList(): RoomProperty[] {
    const activeRoomId: string = this.sceneInteractor.getActiveRoomId();
    return this.sceneInteractor.getRoomProperties(activeRoomId);
  }

  getRoomIdList(): string[] {
    return this.sceneInteractor.getRoomIds();
  }

  getRoomById(roomId: string): Room {
    return this.sceneInteractor.getRoomById(roomId);
  }

  onRoomSelect(roomId: string) {
    const activeRoomId: string = this.sceneInteractor.getActiveRoomId();
    if (roomId === activeRoomId) {
      this.activeRoomIsExpanded = !this.activeRoomIsExpanded;
    }
    else {
      this.activeRoomIsExpanded = true;
    }
    this.sceneInteractor.setActiveRoomId(roomId);
    this.eventBus.onSelectRoom(roomId, false);
  }

  onPropertySelect(roomProperty: RoomProperty) {
    const propertyId: string = roomProperty  && roomProperty.getId() || null;
    this.eventBus.onSelectProperty(propertyId, false);
  }

  propertyIsSelected(item): boolean {
    return item === this.activeProperty;
  }

  roomIsSelected(roomId: string): boolean {
    const numberOfRooms: number = this.sceneInteractor.getRoomIds().length;
    if (numberOfRooms === 0) {
      return false;
    }
    return roomId === this.sceneInteractor.getActiveRoomId();
  }

  roomIsExpanded(roomId: string): boolean {
    return this.roomIsSelected(roomId)
        && this.activeRoomIsExpanded
        && !!this.sceneInteractor.getRoomProperties(roomId).length;
  }

  getProjectName(): string {
    return this.metaDataInteractor.getProjectName();
  }

  onInfoClick($event) {
    setTimeout(() => this.inspectorIsVisible = true);
  }

  private onOffClick($event) {
    if (this.inspectorIsVisible) {
      this.inspectorIsVisible = false;
    }
  }

  toggleOpen($event) {
    this.isOpen = !this.isOpen;
  }

  private onFileLoad($event) {
    const fileName: string = $event.file.name;
    const binaryFileData: any = $event.binaryFileData;
    //const activeRoomId: string = this.sceneInteractor.getActiveRoomId();
    //make UI for 'loading' appear
    this.eventBus.onStartLoading();
    //make thumbnail, and convert to power of 2 image size
    resizeImage(binaryFileData, 'backgroundImage')
      .then(resized => {
        const newRoomId = this.sceneInteractor.addRoom();
        const room: Room = this.sceneInteractor.getRoomById(newRoomId);
        room.setFileData(fileName, resized.backgroundImage);
        room.setThumbnail(fileName, resized.thumbnail);
        this.eventBus.onSelectRoom(null, false);
        this.eventBus.onStopLoading();
      })
      .catch(error => this.eventBus.onModalMessage('Image loading error', error));
  }

  private addSlideshow($event) {
    this.eventBus.onStartLoading();
    this.slideshowBuilder.build($event.files)
      .then(resolve => this.eventBus.onStopLoading())
      .catch(error => this.eventBus.onModalMessage('error', error));
  }
}

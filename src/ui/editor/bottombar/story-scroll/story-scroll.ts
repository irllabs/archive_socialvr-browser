import {Component} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';

import {EventBus, EventType} from 'ui/common/event-bus';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {MetaDataInteractor} from 'core/scene/projectMetaDataInteractor';
import {RoomProperty} from 'data/scene/interfaces/roomProperty';
import {Room} from 'data/scene/entities/room';
import {resizeImage} from 'data/util/imageResizeService';
import {SlideshowBuilder} from 'ui/editor/util/SlideshowBuilder';

@Component({
  selector: 'story-scroll',
  styleUrls: ['./story-scroll.scss'],
  templateUrl: './story-scroll.html'
})
export class StoryScroll {

  private activeProperty: RoomProperty;
  private subscriptions: Set<Subscription> = new Set<Subscription>();
  private activeRoomIsExpanded: boolean = true;
  private inspectorIsVisible: boolean = false;
  private isOpen: boolean = false;

  public get roomIds(): string[] {
    return this.sceneInteractor.getRoomIds();
  }

  constructor(
    private sceneInteractor: SceneInteractor,
    private metaDataInteractor: MetaDataInteractor,
    private eventBus: EventBus,
    private slideshowBuilder: SlideshowBuilder
  ) {}

  private subscribeToEvents() {
    const roomPropertySubscription: Subscription = this.eventBus.getObservable(EventType.SELECT_PROPERTY)
      .subscribe(
        (observedData) => {
          const propertyId: string = observedData.propertyId;
          const activeRoomId: string = this.sceneInteractor.getActiveRoomId();

          this.activeProperty =
            this.sceneInteractor.getPropertyById(activeRoomId, propertyId) ||
            this.sceneInteractor.getRoomById(activeRoomId);
          this.activeRoomIsExpanded = true;
        },
        error => console.log('error', error)
      );

    const roomSubscription: Subscription = this.eventBus.getObservable(EventType.SELECT_ROOM)
      .subscribe(
        () => {
          const activeRoomId = this.sceneInteractor.getActiveRoomId();
          this.activeProperty = this.sceneInteractor.getRoomById(activeRoomId);
        },
        error => console.log('error', error)
      );

    this.subscriptions.add(roomPropertySubscription);
    this.subscriptions.add(roomSubscription);
  }

  ngOnInit() {
    this.subscribeToEvents();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  public hasNextRoomFor(roomId) {
    return this.roomIds.indexOf(roomId) < this.roomIds.length - 1;
  }

  public getRoomById(roomId: string): Room {
    return this.sceneInteractor.getRoomById(roomId);
  }

  public onRoomSelect(roomId: string) {
    const activeRoomId: string = this.sceneInteractor.getActiveRoomId();

    if (roomId === activeRoomId) {
      this.activeRoomIsExpanded = !this.activeRoomIsExpanded;
    } else {
      this.activeRoomIsExpanded = true;
    }

    this.sceneInteractor.setActiveRoomId(roomId);
    this.eventBus.onSelectRoom(roomId, false);
  }

  public roomIsSelected(roomId: string): boolean {
    const numberOfRooms: number = this.roomIds.length;

    if (numberOfRooms === 0) {
      return false;
    }
    return roomId === this.sceneInteractor.getActiveRoomId();
  }

  public onInfoClick() {
    setTimeout(() => this.inspectorIsVisible = true);
  }

  public onOffClick() {
    if (this.inspectorIsVisible) {
      this.inspectorIsVisible = false;
    }
  }

  public toggleOpen() {
    this.isOpen = !this.isOpen;
  }

  public onFileLoad($event) {
    debugger;
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

  public onSwapRoom(roomId, direction = 1){
    const room = this.sceneInteractor.getRoomById(roomId);
    const currentIndex = this.roomIds.indexOf(roomId);

    this.sceneInteractor.changeRoomPosition(room, currentIndex + direction);
  }

  public addSlideShow($event) {
    this.eventBus.onStartLoading();
    this.slideshowBuilder.build($event.files)
      .then(resolve => this.eventBus.onStopLoading())
      .catch(error => this.eventBus.onModalMessage('error', error));
  }
}

import { Component } from '@angular/core';
import { MetaDataInteractor } from 'core/scene/projectMetaDataInteractor';
import { SceneInteractor } from 'core/scene/sceneInteractor';
import { Room } from 'data/scene/entities/room';
import { RoomProperty } from 'data/scene/interfaces/roomProperty';
import { resizeImage } from 'data/util/imageResizeService';
import { Subscription } from 'rxjs/Subscription';

import { EventBus, EventType } from 'ui/common/event-bus';
import { SlideshowBuilder } from 'ui/editor/util/SlideshowBuilder';

@Component({
  selector: 'story-scroll',
  styleUrls: ['./story-scroll.scss'],
  templateUrl: './story-scroll.html',
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
    private slideshowBuilder: SlideshowBuilder,
  ) {
  }

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
        error => console.log('error', error),
      );

    const roomSubscription: Subscription = this.eventBus.getObservable(EventType.SELECT_ROOM)
      .subscribe(
        observedData => {
          const activeRoomId = this.sceneInteractor.getActiveRoomId();
          this.activeProperty = this.sceneInteractor.getRoomById(activeRoomId);
          this.projectIsSelected = false;
        },
        error => console.log('error', error),
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

  public onPropertySelect(roomProperty: RoomProperty) {
    const propertyId: string = roomProperty && roomProperty.getId() || null;
    this.eventBus.onSelectProperty(propertyId, false);
  }

  public propertyIsSelected(item): boolean {
    return item === this.activeProperty;
  }

  public roomIsSelected(roomId: string): boolean {
    const numberOfRooms: number = this.sceneInteractor.getRoomIds().length;
    if (numberOfRooms === 0) {
      return false;
    }
    return roomId === this.sceneInteractor.getActiveRoomId();
  }

  public roomIsLoaded(roomId: string): boolean {
    const room: Room = this.sceneInteractor.getRoomById(roomId);

    return room.isLoadedAssets;
  }

  public roomIsExpanded(roomId: string): boolean {
    return this.roomIsSelected(roomId)
      && this.activeRoomIsExpanded
      && !!this.sceneInteractor.getRoomProperties(roomId).length;
  }

  public getProjectName(): string {
    return this.metaDataInteractor.getProjectName();
  }

  public onInfoClick($event) {
    setTimeout(() => this.inspectorIsVisible = true);
  }

  public onOffClick($event) {
    if (this.inspectorIsVisible) {
      this.inspectorIsVisible = false;
    }
  }

  public toggleOpen($event) {
    this.isOpen = !this.isOpen;
  }

  public onFileLoad($event) {
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

        room.setBackgroundImageBinaryData(resized.backgroundImage);
        room.setThumbnail(resized.thumbnail);

        this.eventBus.onSelectRoom(null, false);
        this.eventBus.onStopLoading();
      })
      .catch(error => this.eventBus.onModalMessage('Image loading error', error));
  }

  public addSlideshow($event) {
    this.eventBus.onStartLoading();
    this.slideshowBuilder.build($event.files)
      .then(resolve => this.eventBus.onStopLoading())
      .catch(error => this.eventBus.onModalMessage('error', error));
  }
}

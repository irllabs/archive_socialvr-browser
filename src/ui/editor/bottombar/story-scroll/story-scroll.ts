import { Component } from '@angular/core';
import { MetaDataInteractor } from 'core/scene/projectMetaDataInteractor';
import { SceneInteractor } from 'core/scene/sceneInteractor';
import { Room } from 'data/scene/entities/room';
import { RoomProperty } from 'data/scene/interfaces/roomProperty';
import { resizeImage } from 'data/util/imageResizeService';
import { Subscription } from 'rxjs/Subscription';

import { EventBus, EventType } from 'ui/common/event-bus';
import { SlideshowBuilder } from 'ui/editor/util/slideshowBuilder';
import { SettingsInteractor } from 'core/settings/settingsInteractor';

@Component({
  selector: 'story-scroll',
  styleUrls: ['./story-scroll.scss'],
  templateUrl: './story-scroll.html',
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

  public get canAddMoreRooms(){
    return this.roomIds.length < this.settingsInteractor.settings.maxRooms
  }

  constructor(
    private sceneInteractor: SceneInteractor,
    private metaDataInteractor: MetaDataInteractor,
    private eventBus: EventBus,
    private slideshowBuilder: SlideshowBuilder,
    private settingsInteractor: SettingsInteractor
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
        (observedData) => {
          const propertyId: string = observedData.propertyId;
          const activeRoomId: string = this.sceneInteractor.getActiveRoomId();

          this.activeProperty =
            this.sceneInteractor.getPropertyById(activeRoomId, propertyId) ||
            this.sceneInteractor.getRoomById(activeRoomId);
          this.activeRoomIsExpanded = true;
        },
        error => console.log('error', error),
      );

    const roomSubscription: Subscription = this.eventBus.getObservable(EventType.SELECT_ROOM)
      .subscribe(
        () => {
          const activeRoomId = this.sceneInteractor.getActiveRoomId();
          this.activeProperty = this.sceneInteractor.getRoomById(activeRoomId);
        },
        error => console.log('error', error),
      );

    this.subscriptions.add(roomPropertySubscription);
    this.subscriptions.add(roomSubscription);
  }

  public hasPrevRoomFor(roomId) {
    return this.roomIds.indexOf(roomId) > 0;
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

  private onOffClick($event) {
    if (this.inspectorIsVisible) {
      this.inspectorIsVisible = false;
    }
  }

  public toggleOpen() {
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
      .catch(error => this.eventBus.onModalMessage('Error', error));
  }

  public onSwapRoom({ roomId, direction }) {
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

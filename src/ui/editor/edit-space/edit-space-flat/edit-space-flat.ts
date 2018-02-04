import {Component, Input, ViewChildren} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';

import {EventBus, EventType} from 'ui/common/event-bus';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {Room} from 'data/scene/entities/room';
import {RoomProperty} from 'data/scene/interfaces/roomProperty';
import {RoomIcon} from 'ui/editor/edit-space/room-icon/room-icon/room-icon';
import {CombinedHotspotUtil} from 'ui/editor/util/combinedHotspotUtil';


@Component({
  selector: 'edit-space-flat',
  styleUrls: ['./edit-space-flat.scss'],
  templateUrl: './edit-space-flat.html'
})
export class EditSpaceFlat {

  private subscriptions: Set<Subscription> = new Set<Subscription>();
  private onResizeFn: Function = this.onResize.bind(this);

  @ViewChildren('roomIcon') roomIconComponentList: RoomIcon[];

  constructor(
    private sceneInteractor: SceneInteractor,
    private combinedHotspotUtil: CombinedHotspotUtil,
    private eventBus: EventBus
  ) {}

  ngOnInit() {
    const selectProperty: Subscription = this.eventBus.getObservable(EventType.SELECT_PROPERTY)
      .subscribe(
        event => {
          const selectedPropertyId = event.propertyId;
          const roomIconList: RoomIcon[] = this.roomIconComponentList
            .filter(roomIcon => roomIcon.roomProperty.getId() !== selectedPropertyId);
          this.combinedHotspotUtil.setRoomPropertyList(roomIconList);
        },
        error => console.log('EditSpaceFlat.ngOnInit', error)
      );

    const roomChange: Subscription = this.eventBus.getObservable(EventType.SELECT_ROOM)
      .subscribe(roomId => this.onResize(null), error => console.log('EditSpaceFlat.onSelectRoom', error));

    this.subscriptions.add(selectProperty);
    this.subscriptions.add(roomChange);

    window.addEventListener('resize', this.onResizeFn, false);
  }

  isVideo() {
    const roomId: string = this.sceneInteractor.getActiveRoomId();
    const room: Room = this.sceneInteractor.getRoomById(roomId);
    return room.getBackgroundIsVideo();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    window.removeEventListener('resize', this.onResizeFn, false)
  }

  //EditSpace interface method
  onResize($event) {
    this.roomIconComponentList.forEach(roomComponent => roomComponent.updatePosition());
  }

  getBackgroundImage(): string {
    const roomId: string = this.sceneInteractor.getActiveRoomId();
    const room: Room = this.sceneInteractor.getRoomById(roomId);
    return room.getBinaryFileData();
  }

  getBackgroundVideo(): string {
    const roomId: string = this.sceneInteractor.getActiveRoomId();
    const room: Room = this.sceneInteractor.getRoomById(roomId);
    return room.getBackgroundVideo();
  }

  getItems(): RoomProperty[] {
    const roomId: string  = this.sceneInteractor.getActiveRoomId();
    return this.sceneInteractor.getRoomProperties(roomId);
  }

  roomHasBackgroundImage(): boolean {
    const roomId: string  = this.sceneInteractor.getActiveRoomId();
    return this.sceneInteractor.roomHasBackgroundImage(roomId);
  }

}

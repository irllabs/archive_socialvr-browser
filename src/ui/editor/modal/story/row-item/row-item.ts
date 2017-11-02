import {Component, Input} from '@angular/core';

import {Room} from 'data/scene/entities/room';
import {RoomProperty} from 'data/scene/interfaces/roomProperty';
import {RoomPropertyTypeService} from 'ui/editor/util/roomPropertyTypeService';
import {ICON_PATH} from 'ui/common/constants';

import {PropertyRemovalService} from 'ui/editor/util/propertyRemovalService';
import {SceneInteractor} from 'core/scene/sceneInteractor';


@Component({
  selector: 'row-item',
  styleUrls: ['./row-item.scss'],
  templateUrl: './row-item.html'
})
export class RowItem {

  @Input() roomProperty: RoomProperty;
  @Input() caretIsExpanded: boolean;
  @Input() isActive: boolean;

  private propertyIsRoom: boolean = false;

  constructor(
    private propertyRemovalService: PropertyRemovalService,
    private sceneInteractor: SceneInteractor
  ) {}

  ngOnInit() {
    this.propertyIsRoom = RoomPropertyTypeService.getTypeString(this.roomProperty) === 'room';
  }

  onDeleteClick() {
    if (this.isHomeRoom()) {
      this.sceneInteractor.setHomeRoomId(null);
    }
    this.propertyRemovalService.removeProperty(this.roomProperty);
  }

  getLabelText() {
    return this.roomProperty.getName();
  }

  onLabelChange($event) {
    if (this.propertyIsRoom) {
      this.sceneInteractor.setRoomName(this.roomProperty.getId(), $event.text);
    }
    else {
      this.roomProperty.setName($event.text);
    }
  }

  isHomeRoom(): boolean {
    const roomId: string = this.roomProperty.getId();
    return this.sceneInteractor.isHomeRoom(roomId);
  }

  setAsHomeRoom() {
    const roomId: string = this.roomProperty.getId();
    this.sceneInteractor.setHomeRoomId(roomId);
  }

  getBackgroundThumbnail(): string {
    const roomId: string = this.roomProperty.getId();
    const room: Room = this.sceneInteractor.getRoomById(roomId);
    return room.getThumbnailImage();
  }

}

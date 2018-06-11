import { Component, EventEmitter, Input, NgZone, Output } from '@angular/core';
import { SceneInteractor } from 'core/scene/sceneInteractor';

import { Room } from 'data/scene/entities/room';

import { PropertyRemovalService } from 'ui/editor/util/propertyRemovalService';
import { RoomPropertyTypeService } from 'ui/editor/util/roomPropertyTypeService';

@Component({
  selector: 'storymap-item',
  styleUrls: ['./storymap-item.scss'],
  templateUrl: './storymap-item.html',
})
export class StorymapItem {

  @Input() roomProperty: Room;
  @Input() isActive: boolean;
  @Output() infoEvent = new EventEmitter();
  @Output() deleteEvent = new EventEmitter();

  private propertyIsRoom: boolean = false;
  private inspectorIsVisible = false;

  constructor(
    private propertyRemovalService: PropertyRemovalService,
    private sceneInteractor: SceneInteractor,
    protected ngZone: NgZone,
  ) {
  }


  ngOnInit() {
    this.propertyIsRoom = RoomPropertyTypeService.getTypeString(this.roomProperty) === 'room';
  }

  onDeleteClick() {
    if (this.isHomeRoom()) {
      this.sceneInteractor.setHomeRoomId(null);
    }
    this.propertyRemovalService.removeProperty(this.roomProperty);
  }

  onInfoClick($event) {
    this.infoEvent.emit();
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

  private getRoomName(): string {
    const roomId = this.sceneInteractor.getActiveRoomId();
    const room = this.sceneInteractor.getRoomById(roomId);
    return room.getName();
  }

  private setRoomName($event) {
    const roomId = this.sceneInteractor.getActiveRoomId();
    const room = this.sceneInteractor.getRoomById(roomId);
    room.setName($event.text);
  }

  getName(): string {
    return this.roomProperty.getName();
  }

  onNameChange($event) {
    this.roomProperty.setName($event.text);
  }


}

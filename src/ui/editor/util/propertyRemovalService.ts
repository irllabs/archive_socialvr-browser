import { Injectable } from '@angular/core';

import { SceneInteractor } from 'core/scene/sceneInteractor';
import { Door } from 'data/scene/entities/door';

import { Universal } from 'data/scene/entities/universal';
import { RoomProperty } from 'data/scene/interfaces/roomProperty';
import { EventBus } from 'ui/common/event-bus';
import { RoomPropertyTypeService } from 'ui/editor/util/roomPropertyTypeService';


@Injectable()
export class PropertyRemovalService {

  constructor(
    private sceneInteractor: SceneInteractor,
    private eventBus: EventBus,
  ) {
  }

  removeProperty(roomProperty: RoomProperty) {
    const propertyType: string = RoomPropertyTypeService.getTypeString(roomProperty);
    this.removePropertyStrategy(propertyType, roomProperty);
  }

  private removePropertyStrategy(propertyType: string, roomProperty: RoomProperty) {
    const roomId = this.sceneInteractor.getActiveRoomId();
    const removalStrategy = {
      door: () => {
        const door: Door = <Door> roomProperty;
        this.sceneInteractor.removeDoor(roomId, door);
        this.onDeselect();
      },
      room: () => {
        const removeRoomId: string = roomProperty.getId();
        this.sceneInteractor.removeRoom(removeRoomId);

        const activeRoomId: string = this.sceneInteractor.getActiveRoomId();
        this.eventBus.onSelectRoom(activeRoomId, false);
      },
      universal: () => {
        const universal: Universal = <Universal> roomProperty;
        this.sceneInteractor.removeUniversal(roomId, universal);
        this.onDeselect();
      },
    };
    removalStrategy[propertyType]();
  }

  private onDeselect() {
    this.eventBus.onSelectProperty(null, false);
    this.eventBus.onHotspotVisibility(false);
  }
}

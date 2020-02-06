import { Injectable } from '@angular/core';
import { AssetManager } from 'data/asset/assetManager';

import { Door } from 'data/scene/entities/door';
import { Room } from 'data/scene/entities/room';
import { Universal } from 'data/scene/entities/universal';
import { RoomProperty } from 'data/scene/interfaces/roomProperty';

import { RoomManager } from 'data/scene/roomManager';
import { PropertyBuilder } from 'data/scene/roomPropertyBuilder';
import { EventBus } from '../../ui/common/event-bus';
import { MetaDataInteractor } from './projectMetaDataInteractor';
import { SettingsInteractor } from 'core/settings/settingsInteractor';

@Injectable()
export class SceneInteractor {
  private _activeRoomId: string;

  constructor(
    private roomManager: RoomManager,
    private propertyBuilder: PropertyBuilder,
    private assetManager: AssetManager,
    private projectMetaDataInteractor: MetaDataInteractor,
    private settingsInteractor: SettingsInteractor,
    private eventBus: EventBus,
  ) {
    if (!this.getRoomIds().length) {
      this.addRoom(true);
    }
  }

  public isLoadedAssets() {
    const rooms = Array.from(this.roomManager.getRooms());
    const hasRoomWithoutAssets = rooms.find(room => !room.isLoadedAssets);

    return !hasRoomWithoutAssets;
  }

  changeRoomPosition(room, position) {
    const rooms = this.roomManager.getRooms();

    this.roomManager.clearRooms();
    rooms.delete(room);

    const roomsArray = Array.from(rooms);

    rooms.clear();

    roomsArray.splice(position, 0, room);

    roomsArray.forEach(room => this.roomManager.addRoom(room));
  }

  getRoomIds(): string[] {
    return Array.from(this.roomManager.getRooms())
      .map(room => room.getId());
  }

  getRoomById(roomId: string): Room {
    return this.roomManager.getRoomById(roomId);
  }

  addRoom(silent = false): string {
    const numberOfRooms: number = this.roomManager.getRooms().size;

    if(!silent){
      const { maxRooms } = this.settingsInteractor.settings;
      if(numberOfRooms >= maxRooms){
        throw new Error('You have reached maximum amount of rooms');
      }
    }
   
    const roomName: string = `Room ${numberOfRooms+1}`;
    const room: Room = this.propertyBuilder.room(roomName);

    this.roomManager.addRoom(room);
    this._activeRoomId = room.getId();

    if (!silent) {
      this.projectMetaDataInteractor.onProjectChanged();
    }

    return this._activeRoomId;
  }

  removeRoom(roomId: string) {
    if (this.getRoomIds().length < 2) {
      console.warn('user should not be allowed to remove last room');
      return;
    }
    this.eventBus.onModalMessage(
      '',
      'Do you want to delete the room?',
      true,
      // modal dismissed callback
      () => {
      },
      // modal accepted callback
      () => {
        this._activeRoomId = null;
        this.roomManager.removeRoomById(roomId);

        //remove door references to deleted room
        Array.from(this.roomManager.getRooms())
          .map(room => room.getDoors())
          .reduce((aggregateList, doorSet) => {
            return aggregateList.concat(
              Array.from(doorSet).filter(door => door.getRoomId() === roomId),
            );
          }, [])
          .forEach(door => door.reset());

        this.projectMetaDataInteractor.onProjectChanged();
      },
    );
  }

  getActiveRoomId(): string {
    if (!this._activeRoomId) {
      return this.getRoomIds()[0];
    }
    return this._activeRoomId;
  }

  getActiveRoom(): Room {
    return this.getRoomById(this.getActiveRoomId())
  }

  setActiveRoomId(roomId: string) {
    this._activeRoomId = roomId;
    this.projectMetaDataInteractor.onProjectChanged();
  }

  getRoomProperties(roomId: string): RoomProperty[] {
    const room: Room = this.getRoomById(roomId);

    if (!room) {
      return null;
    }

    return [
      ...Array.from(room.getUniversal()),
      ...Array.from(room.getDoors()),
    ]
      .sort((a, b) => a.getTimestamp() - b.getTimestamp());
  }

  getPropertyById(roomId: string, propertyId: string): RoomProperty {
    return this.getRoomProperties(roomId)
      .find(roomProperty => roomProperty.getId() === propertyId);
  }

  addUniversal(roomId: string): Universal {
    const { maxHotspots } = this.settingsInteractor.settings;
    const numberOfUniversals: number = this.getRoomById(roomId).getUniversal().size;

    if(numberOfUniversals >= maxHotspots) {
      throw new Error('You have reached maximum amount of hotspots per room')
    }

    const hotSpotName: string = `Hotspot ${numberOfUniversals+1}`;
    
    const universal: Universal = this.propertyBuilder.universal(hotSpotName, '');
    console.log(universal);

    this.getRoomById(roomId).addUniversal(universal);

    this.projectMetaDataInteractor.onProjectChanged();

    return universal;
  }

  removeUniversal(roomId: string, universal: Universal) {
    if (universal.hasData) {
      this.eventBus.onModalMessage(
        '',
        'Do you want to delete the hotspot?',
        true,
        // modal dismissed callback
        () => {
        },
        // modal accepted callback
        () => {
          this._removeUniversal(roomId, universal);
        },
      );
    } else {
      this._removeUniversal(roomId, universal);
    }
  }

  _removeUniversal(roomId: string, universal: Universal) {
    this.getRoomById(roomId).removeUniversal(universal);
    this.projectMetaDataInteractor.onProjectChanged();
  }

  addDoor(roomId: string): Door {
    const outgoingRoomId = this.getRoomIds().filter(rId => rId !== roomId)[0];
    const outgoingRoomName = this.getRoomById(outgoingRoomId).getName();
    const door: Door = this.propertyBuilder.door(outgoingRoomId, outgoingRoomName);

    // if there are multiple options, let the user decide
    if (this.getRoomIds().length > 2) {
      door.reset();
    }

    this.getRoomById(roomId).addDoor(door);

    this.projectMetaDataInteractor.onProjectChanged();

    return door;
  }

  removeDoor(roomId: string, door: Door) {
    this.getRoomById(roomId).removeDoor(door);
    this.projectMetaDataInteractor.onProjectChanged();
  }

  roomHasBackgroundImage(roomId: string): boolean {
    return this.getRoomById(roomId).hasBackgroundImage();
  }

  getHomeRoomId(): string {
    return this.roomManager.getHomeRoomId();
  }

  isHomeRoom(roomId: string): boolean {
    return roomId === this.roomManager.getHomeRoomId();
  }

  setHomeRoomId(roomId: string) {
    this.roomManager.setHomeRoomId(roomId);
    this.projectMetaDataInteractor.onProjectChanged();
  }

  resetRoomManager() {
    this.roomManager.initValues();
    this.assetManager.clearAssets();
    this.addRoom();
  }

  setRoomName(roomId: string, name: string) {
    this.getRoomById(roomId).setName(name);

    // Rename all doors going to the renamed room
    this.getRoomIds()
      .map(roomId => this.getRoomById(roomId).getDoors())
      .reduce((aggregateList, doorSet) => {
        const doorsToRenamedRoom: Door[] = Array.from(doorSet)
          .filter(door => door.getRoomId() === roomId && !door.hasCustomName());
        return aggregateList.concat(doorsToRenamedRoom);
      }, [])
      .forEach(door => door.setName(name));

    this.projectMetaDataInteractor.onProjectChanged();
  }
}

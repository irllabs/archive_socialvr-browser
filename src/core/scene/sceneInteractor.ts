import { Injectable } from '@angular/core';
import { AssetManager } from 'data/asset/assetManager';

import { Audio } from 'data/scene/entities/audio';
import { Door } from 'data/scene/entities/door';
import { Image } from 'data/scene/entities/image';
import { Link } from 'data/scene/entities/link';
import { Room } from 'data/scene/entities/room';
import { Text } from 'data/scene/entities/text';
import { Universal } from 'data/scene/entities/universal';
import { Video } from 'data/scene/entities/video';
import { RoomProperty } from 'data/scene/interfaces/roomProperty';

import { RoomManager } from 'data/scene/roomManager';
import { PropertyBuilder } from 'data/scene/roomPropertyBuilder';

@Injectable()
export class SceneInteractor {

  private activeRoomId: string;

  constructor(
    private roomManager: RoomManager,
    private propertyBuilder: PropertyBuilder,
    private assetManager: AssetManager,
  ) {
    if (!this.getRoomIds().length) {
      this.addRoom();
    }
  }

  changeRoomPosition(room, position) {
    console.log('changeRoomPosition', room, position);
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

  addRoom(): string {
    const numberOfRooms: number = this.roomManager.getRooms().size + 1;
    const roomName: string = `Room ${numberOfRooms}`;
    const room: Room = this.propertyBuilder.room(roomName);
    this.roomManager.addRoom(room);
    this.activeRoomId = room.getId();
    return this.activeRoomId;
  }

  removeRoom(roomId: string) {
    if (this.getRoomIds().length < 2) {
      console.warn('user should not be allowed to remove last room');
      return;
    }
    this.activeRoomId = null;
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

  }

  getActiveRoomId(): string {
    if (!this.activeRoomId) {
      return this.getRoomIds()[0];
    }
    return this.activeRoomId;
  }

  setActiveRoomId(roomId: string) {
    this.activeRoomId = roomId;
  }

  getRoomProperties(roomId: string): RoomProperty[] {
    const room: Room = this.getRoomById(roomId);

    if (!room) {
      return null;
    }

    return [
      ...Array.from(room.getText()),
      ...Array.from(room.getAudio()),
      ...Array.from(room.getVideo()),
      ...Array.from(room.getUniversal()),
      ...Array.from(room.getImages()),
      ...Array.from(room.getDoors()),
      ...Array.from(room.getLink()),
    ]
      .sort((a, b) => a.getTimestamp() - b.getTimestamp());
  }

  getPropertyById(roomId: string, propertyId: string): RoomProperty {
    return this.getRoomProperties(roomId)
      .find(roomProperty => roomProperty.getId() === propertyId);
  }

  addText(roomId: string): Text {
    const numberOfTexts: number = this.getRoomById(roomId).getText().size + 1;
    const textName: string = `Text ${numberOfTexts}`;
    const text: Text = this.propertyBuilder.text(textName, '');

    this.getRoomById(roomId).addText(text);

    return text;
  }

  removeText(roomId: string, text: Text) {
    this.getRoomById(roomId).removeText(text);
  }

  addAudio(roomId: string): Audio {
    const numberOfAudio: number = this.getRoomById(roomId).getAudio().size + 1;
    const audioName: string = `Audio ${numberOfAudio}`;
    const audio: Audio = this.propertyBuilder.audio(audioName);

    this.getRoomById(roomId).addAudio(audio);

    return audio;
  }

  removeAudio(roomId: string, audio: Audio) {
    this.getRoomById(roomId).removeAudio(audio);
  }

  addImage(roomId: string): Image {
    const numberOfImages: number = this.getRoomById(roomId).getImages().size + 1;
    const imageName: string = `Image ${numberOfImages}`;
    const image: Image = this.propertyBuilder.image(imageName);

    this.getRoomById(roomId).addImage(image);

    return image;
  }

  removeImage(roomId: string, image: Image) {
    this.getRoomById(roomId).removeImage(image);
  }

  addVideo(roomId: string): Video {
    const numberOfVideos: number = this.getRoomById(roomId).getVideo().size + 1;
    const videoName: string = `Video ${numberOfVideos}`;
    const video: Video = this.propertyBuilder.video(videoName, '');

    this.getRoomById(roomId).addVideo(video);

    return video;
  }

  removeVideo(roomId: string, video: Video) {
    this.getRoomById(roomId).removeVideo(video);
  }

  addUniversal(roomId: string): Universal {
    const numberOfUniversals: number = this.getRoomById(roomId).getUniversal().size + 1;
    const hotSpotName: string = `Hotspot ${numberOfUniversals}`;
    const universal: Universal = this.propertyBuilder.universal(hotSpotName, '');

    this.getRoomById(roomId).addUniversal(universal);

    return universal;
  }

  removeUniversal(roomId: string, universal: Universal) {
    this.getRoomById(roomId).removeUniversal(universal);
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
    return door;
  }

  removeDoor(roomId: string, door: Door) {
    this.getRoomById(roomId).removeDoor(door);
  }

  addLink(roomId: string): Link {
    const numberOfLinks: number = this.getRoomById(roomId).getLink().size + 1;
    const linkName: string = `Link ${numberOfLinks}`;
    const link: Link = this.propertyBuilder.link(linkName, '');
    this.getRoomById(roomId).addLink(link);
    return link;
  }

  removeLink(roomId: string, link: Link) {
    this.getRoomById(roomId).removeLink(link);
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
      }, new Array<Door>())
      .forEach(door => door.setName(name));
  }

}

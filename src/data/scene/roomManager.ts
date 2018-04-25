import { Injectable } from '@angular/core';

import {Audio} from 'data/scene/entities/audio';
import {Room} from 'data/scene/entities/room';
import {Door} from 'data/scene/entities/door';

import {
  DEFAULT_PROJECT_NAME,
  DEFAULT_PROJECT_DESCRIPTION,
  DEFAULT_VOLUME
} from 'ui/common/constants';

@Injectable()
export class RoomManager {

  private projectName: string;
  private projectTags: string;
  private projectDescription: string;
  private rooms: Set<Room>;
  private homeRoomId: string;
  private isReadOnly: boolean = false;
  private soundtrack: Audio = new Audio();
  private soundtrackVolume: number = DEFAULT_VOLUME;

  constructor() {
    this.initValues();
  }

  initValues() {
    this.projectName = DEFAULT_PROJECT_NAME;
    this.projectDescription = DEFAULT_PROJECT_DESCRIPTION;
    this.projectTags = '';
    this.rooms = new Set<Room>();
    this.homeRoomId = '';
  }

  addRoom(room: Room) {
    this.rooms.add(room);
  }

  getRoomById(roomId: string): Room {
    return Array.from(this.rooms)
      .find(room => room.getId() === roomId);
  }

  removeRoomById(roomId: string) {
    this.rooms.delete(this.getRoomById(roomId));
  }

  getRooms(): Set<Room> {
    return this.rooms;
  }

  clearRooms() {
    this.rooms = new Set<Room>();
  }

  getProjectName(): string {
    return this.projectName;
  }

  setProjectName(projectName: string) {
    this.projectName = projectName;
  }

  getProjectDescription(): string {
    return this.projectDescription;
  }

  setProjectDescription(projectDescription: string) {
    this.projectDescription = projectDescription;
  }

  getHomeRoomId(): string {
    if (!this.homeRoomId) {
      return Array.from(this.getRooms())[0].getId();
    }
    return this.homeRoomId;
  }

  setHomeRoomId(homeRoomId: string) {
    this.homeRoomId = homeRoomId;
  }

  getProjectIsEmpty(): boolean {
    if (this.rooms.size === 1) {
      return !Array.from(this.rooms)[0].hasBackgroundImage();
    }
    else {
      return false;
    }
  }

  getProjectTags(): string {
    return this.projectTags;
  }

  setProjectTags(tags: string) {
    this.projectTags = tags;
  }

  getIsReadOnly(): boolean {
    return this.isReadOnly;
  }

  setIsReadOnly(isReadOnly: boolean) {
    this.isReadOnly = isReadOnly;
  }

  getSoundtrack(): Audio {
    return this.soundtrack;
  }

  setSoundtrack(fileName: string, volume: number, dataUrl) {
    if (fileName === undefined || fileName === null) {
      this.soundtrack.setFileName('');
    } else {
      this.soundtrack.setFileName(fileName);
      this.soundtrack.setBinaryFileData(dataUrl);
      this.setSoundtrackVolume(volume);
    }
  }

  setSoundtrackVolume(v: number) {
    if (v === undefined || v === null) {
      this.soundtrackVolume = DEFAULT_VOLUME
    }
    else {
      this.soundtrackVolume = v
    }
  }

  removeSoundtrack() {
    this.soundtrack = new Audio();
  }

  getSoundtrackVolume(): number {
    return this.soundtrackVolume;
  }
}

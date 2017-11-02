import {Injectable} from '@angular/core';

import {RoomManager} from 'data/scene/roomManager';

@Injectable()
export class MetaDataInteractor {

  constructor(private roomManager: RoomManager) {}

  getProjectName(): string {
    return this.roomManager.getProjectName();
  }

  setProjectName(projectName: string) {
    this.roomManager.setProjectName(projectName);
  }

  getProjectDescription(): string {
    return this.roomManager.getProjectDescription();
  }

  setProjectDescription(projectDescription: string) {
    this.roomManager.setProjectDescription(projectDescription)
  }

  projectIsEmpty(): boolean {
    return this.roomManager.getProjectIsEmpty();
  }

  getProjectTags(): string {
    return this.roomManager.getProjectTags();
  }

  setProjectTags(tags: string) {
    this.roomManager.setProjectTags(tags);
  }

  getIsReadOnly(): boolean {
    return this.roomManager.getIsReadOnly();
  }

  setIsReadOnly(isReadOnly: boolean) {
    this.roomManager.setIsReadOnly(isReadOnly);
  }

  getSoundtrack(): any {
    return this.roomManager.getSoundtrack();
  }

  setSoundtrack(fileName: string, volume: number, dataUrl: any) {
    return this.roomManager.setSoundtrack(fileName, volume, dataUrl);
  }

  removeSoundtrack() {
    this.roomManager.removeSoundtrack();
  }

  setSoundtrackVolume(v: number) {
    this.roomManager.setSoundtrackVolume(v);
  }

  getSoundtrackVolume(): number {
    return this.roomManager.getSoundtrackVolume();
  }

}

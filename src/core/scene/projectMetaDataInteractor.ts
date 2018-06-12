import { Injectable } from '@angular/core';

import { RoomManager } from 'data/scene/roomManager';
import { EventBus } from '../../ui/common/event-bus';

@Injectable()
export class MetaDataInteractor {
  private _hasUnsavedChanges: boolean = false;
  private _loading: boolean = false;

  public get hasUnsavedChanges(): boolean {
    return this._hasUnsavedChanges;
  }

  constructor(
    private roomManager: RoomManager,
    private eventBus: EventBus,
  ) {
    window.addEventListener('beforeunload',  (e) => {
      if (this.hasUnsavedChanges) {
        const confirmationMessage = "You are about lose your work. Are you sure?";

        e.returnValue = confirmationMessage;     // Gecko, Trident, Chrome 34+
        return confirmationMessage;
      }
    });
  }

  public loadingProject(isLoading) {
    this._loading = isLoading;
  }

  public onProjectChanged() {
    if (!this._loading) {
      this._hasUnsavedChanges = true;
    }
  }

  public onProjectSaved() {
    this._hasUnsavedChanges = false;
  }

  public checkAndConfirmResetChanges(msg = 'If you do not save your changes before opening a new story file, those changes will be lost.') {
    return new Promise((resolve, reject) => {
      if (this.hasUnsavedChanges) {
        this.eventBus.onModalMessage(
          '',
          msg,
          true,
          // modal dismissed callback
          reject,
          // modal accepted callback
          resolve,
        );
      } else {
        resolve();
      }
    });
  }

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
    this.roomManager.setProjectDescription(projectDescription);
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

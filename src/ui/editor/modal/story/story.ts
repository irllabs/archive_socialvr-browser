import { Component, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectInteractor } from 'core/project/projectInteractor';
import { MetaDataInteractor } from 'core/scene/projectMetaDataInteractor';

import { SceneInteractor } from 'core/scene/sceneInteractor';
import { StorageInteractor } from 'core/storage/storageInteractor';
import { UserInteractor } from 'core/user/userInteractor';

import { Audio } from 'data/scene/entities/audio';

import { DEFAULT_PROJECT_NAME, DEFAULT_VOLUME } from 'ui/common/constants';
import { EventBus } from 'ui/common/event-bus';
import { SlideshowBuilder } from 'ui/editor/util/SlideshowBuilder';

const FileSaver = require('file-saver');

@Component({
  selector: 'story',
  styleUrls: ['./story.scss'],
  templateUrl: './story.html',
})
export class Story {

  private isBeingInstantiated: boolean = true;

  constructor(
    private router: Router,
    private sceneInteractor: SceneInteractor,
    private storageInteractor: StorageInteractor,
    private metaDataInteractor: MetaDataInteractor,
    private userInteractor: UserInteractor,
    private projectInteractor: ProjectInteractor,
    private eventBus: EventBus,
    private slideshowBuilder: SlideshowBuilder,
    private element: ElementRef,
  ) {
  }

  @HostListener('document:click', ['$event'])
  private onDocumentClick($event) {
    const isClicked: boolean = this.element.nativeElement.contains($event.target);
    if (this.isBeingInstantiated) {
      this.isBeingInstantiated = false;
      return;
    }
    if (!isClicked) {
      this.router.navigate(['/editor', { outlets: { 'modal': null } }]);
    }
  }

  addRoom($event) {
    this.sceneInteractor.addRoom();
    this.router.navigate(['/editor', { outlets: { 'view': 'flat' } }]);
    this.eventBus.onSelectRoom(null, true);
  }

  private addSlideshow($event) {
    this.eventBus.onStartLoading();
    this.slideshowBuilder.build($event.files)
      .then(resolve => this.eventBus.onStopLoading())
      .catch(error => this.eventBus.onModalMessage('error', error));
  }

  private getProjectName(): string {
    const projectName: string = this.metaDataInteractor.getProjectName();
    return projectName === DEFAULT_PROJECT_NAME ? undefined : projectName;
  }

  private setProjectName($event) {
    this.metaDataInteractor.setProjectName($event.text);
  }

  private getProjectTags(): string {
    return this.metaDataInteractor.getProjectTags();
  }

  private setProjectTags($event) {
    this.metaDataInteractor.setProjectTags($event.text);
  }

  private getSoundtrack(): Audio {
    return this.metaDataInteractor.getSoundtrack();
  }

  private removeSoundtrack() {
    this.metaDataInteractor.removeSoundtrack();
  }

  private getSoundtrackVolume(): number {
    return this.metaDataInteractor.getSoundtrackVolume();
  }

  public onSoundtrackLoad($event) {
    this.metaDataInteractor.setSoundtrack($event.file.name, DEFAULT_VOLUME, $event.binaryFileData);
  }

  public onVolumeChange($event) {
    const volume = $event.currentTarget.volume;
    this.metaDataInteractor.setSoundtrackVolume(volume);
  }

  public onNewStoryClick($event) {
    //console.log('onNewStoryClick 1');
    this.eventBus.onModalMessage(
      '',
      'If you do not save your changes before opening a new story file, those changes will be lost.',
      true,
      // modal dismissed callback
      () => {
      },
      // modal accepted callback
      () => {
        //console.log('onNewStoryClick 2');
        this.router.navigate(['/editor', { outlets: { 'modal': 'upload' } }]);
        if ($event.shiftKey) {
          this.eventBus.onOpenFileLoader('zip');
          return;
        }
        //console.log('onNewStoryClick 4');
        this.sceneInteractor.setActiveRoomId(null);
        this.sceneInteractor.resetRoomManager();
        this.projectInteractor.setProjectId(null);
        this.eventBus.onSelectRoom(null, false);
        this.metaDataInteractor.setIsReadOnly(false);
      },
    );

  }

  public onOpenStoryLocallyClick(event) {
    if (!this.userInteractor.isLoggedIn()) {
      this.eventBus.onModalMessage('Error', 'You must be logged in to upload from .zip');
      return;
    }

    this.eventBus.onOpenFileLoader('zip');
    this.router.navigate(['/editor', { outlets: { 'modal': null } }]);
  }

  public onSaveStoryClick(event) {
    if (this.metaDataInteractor.projectIsEmpty()) {
      this.eventBus.onModalMessage('Error', 'Cannot save an empty project');
      return;
    }
    if (!this.userInteractor.isLoggedIn()) {
      this.eventBus.onModalMessage('Error', 'You must be logged in to save to the server');
      return;
    }
    if (this.metaDataInteractor.getIsReadOnly()) {
      this.eventBus.onModalMessage('Permissions Error', 'It looks like you are working on a different user\'s project. You cannot save this to your account but you can save it locally by shift-clicking the save button.');
      return;
    }
    // if (this.userInteractor.isLoggedIn()) {

    this.saveStoryFileToServer();
  }

  public onSaveStoryLocallyClick(event) {
    if (this.metaDataInteractor.projectIsEmpty()) {
      this.eventBus.onModalMessage('Error', 'Cannot save an empty project');
      return;
    }

    if (this.metaDataInteractor.getIsReadOnly()) {
      this.eventBus.onModalMessage('Permissions Error', 'It looks like you are working on a different user\'s project. You cannot save this to your account but you can save it locally by shift-clicking the save button.');
      return;
    }
    if (!this.userInteractor.isLoggedIn()) {
      this.eventBus.onModalMessage('Error', 'You must be logged in to download as .zip');
      return;
    }

    const projectName = this.metaDataInteractor.getProjectName() || 'StoryFile';
    const zipFileName = `${projectName}.zip`;

    this.eventBus.onStartLoading();
    this.storageInteractor.serializeProject()
      .subscribe(
        (zipFile) => {
          this.eventBus.onStopLoading();
          FileSaver.saveAs(zipFile, zipFileName);
        },
        (error) => {
          this.eventBus.onStopLoading();
          this.eventBus.onModalMessage('File Download Error', error);
        },
      );
  }

  private saveStoryFileToServer() {
    const projectId: string = this.projectInteractor.getProjectId();
    const isWorkingOnSavedProject: boolean = this.projectInteractor.isWorkingOnSavedProject();

    const onSuccess = () => {
      this.eventBus.onStopLoading();
      this.eventBus.onModalMessage('', 'Your project has been saved.');
    };

    const onError = (error) => {
      this.eventBus.onStopLoading();
      this.eventBus.onModalMessage('Save error', error);
    };

    this.eventBus.onStartLoading();

    if (isWorkingOnSavedProject) {
      this.projectInteractor.updateProject(projectId).subscribe(onSuccess, onError);
    } else {
      this.projectInteractor.createProject().subscribe(onSuccess, onError);
    }
  }
}

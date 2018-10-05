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
import { Project } from '../../../../data/project/projectModel';
import { SettingsService } from 'data/settings/settingsService';

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
    private settingsService: SettingsService
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

  public getProjectName(): string {
    const projectName: string = this.metaDataInteractor.getProjectName();

    return projectName === DEFAULT_PROJECT_NAME ? undefined : projectName;
  }

  public setProjectName($event) {
    this.metaDataInteractor.setProjectName($event.text);
  }

  public getProjectTags(): string {
    return this.metaDataInteractor.getProjectTags();
  }

  public setProjectTags($event) {
    this.metaDataInteractor.setProjectTags($event.text);
  }

  public getSoundtrack(): Audio {
    return this.metaDataInteractor.getSoundtrack();
  }

  private removeSoundtrack() {
    this.metaDataInteractor.removeSoundtrack();
  }

  public getSoundtrackVolume(): number {
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
    this.metaDataInteractor.checkAndConfirmResetChanges().then(() => {
      this.metaDataInteractor.loadingProject(true);
      this.router.navigate(['/editor', { outlets: { 'modal': 'upload' } }]);
        if ($event.shiftKey) {
          this.eventBus.onOpenFileLoader('zip');
          return;
        }
        this.removeSoundtrack();
        this.sceneInteractor.setActiveRoomId(null);
        this.sceneInteractor.resetRoomManager();
        this.projectInteractor.setProject(null);
        this.eventBus.onSelectRoom(null, false);
        this.metaDataInteractor.setIsReadOnly(false);
        this.metaDataInteractor.loadingProject(false);
    }, () => {});
  }

  public onOpenStoryLocallyClick(event) {
    this.metaDataInteractor.checkAndConfirmResetChanges().then(() => {
      if (!this.userInteractor.isLoggedIn()) {
        this.eventBus.onModalMessage('Error', 'You must be logged in to upload from .zip');
        return;
      }

      this.eventBus.onOpenFileLoader('zip');
      this.router.navigate(['/editor', { outlets: { 'modal': null } }]);
    }, () => {});
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
    const project: Project = this.projectInteractor.getProject();
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
      this.projectInteractor.updateProject(project).then(onSuccess, onError);
    } else {
      this.projectInteractor.getProjects().subscribe(projects => {
        if (projects.length >= this.settingsService.settings.maxProjects) {
          return onError("You have reached maximum number of projects");
        }
        this.projectInteractor.createProject().then(onSuccess, onError);
      })
    }
  }
}

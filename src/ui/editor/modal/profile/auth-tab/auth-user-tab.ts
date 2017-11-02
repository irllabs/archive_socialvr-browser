import {Component} from '@angular/core';
import {Router, NavigationExtras} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';

import {MetaDataInteractor} from 'core/scene/projectMetaDataInteractor';
import {DEFAULT_PROJECT_NAME} from 'ui/common/constants';
import {StorageInteractor} from 'core/storage/storageInteractor';
import {UserInteractor} from 'core/user/userInteractor';
import {ProjectInteractor} from 'core/project/projectInteractor';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {AdminInteractor} from 'core/admin/adminInteractor';
import {EventBus, EventType} from 'ui/common/event-bus';

const FileSaver = require('file-saver');

@Component({
  selector: 'auth-user-tab',
  styleUrls: ['./auth-user-tab.scss'],
  templateUrl: './auth-user-tab.html'
})
export class AuthUserTab {

  private projectList = <any>[]; //TODO: move to repo / cache

  constructor(
    private userInteractor: UserInteractor,
    private projectInteractor: ProjectInteractor,
    private sceneInteractor: SceneInteractor,
    private eventBus: EventBus,
    private storageInteractor: StorageInteractor,
    private metaDataInteractor: MetaDataInteractor,
    private adminInteractor: AdminInteractor,
    private router: Router
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.userInteractor.getUser()
        .switchMap(user => this.projectInteractor.getProjects(user.id))
        .subscribe(
          projects => this.projectList = projects,
          error => console.error('GET /users', error)
        );
    });

  }

  private getUserName(): string {
    return this.userInteractor.getUserName();
  }

  private onLogOutClick() {
    this.userInteractor.logOut()
      .subscribe(
        response => {},
        error => console.log('error', error)
      );
  }

  private openProject(projectId: string) {
    console.log("openProject");
    const userId: string = this.userInteractor.getUserId();
    this.eventBus.onStartLoading();
    console.log("onStartLoading done");
    this.projectInteractor.openProject(userId, projectId)
      .subscribe(
        response => {
          //reset the current scene
          this.sceneInteractor.setActiveRoomId(null);
          this.eventBus.onSelectRoom(null, false);
          this.metaDataInteractor.setIsReadOnly(false);
        },
        error => console.error('error', error),
        () => this.eventBus.onStopLoading()
      );
    this.router.navigateByUrl('/editor');
  }

  private createProject($event) {
    const userId: string = this.userInteractor.getUserId();
    this.eventBus.onStartLoading();
    this.projectInteractor.createProject(userId)
      .subscribe(
        projectData => this.projectList.push(projectData),
        error => console.error('error', error),
        () => this.eventBus.onStopLoading()
      );
  }

  private updateProject() {
    const userId: string = this.userInteractor.getUserId();
    const projectId: string = this.projectInteractor.getProjectId();
    this.eventBus.onStartLoading();
    this.projectInteractor.updateProject(userId, projectId)
      .subscribe(
        response => {},
        error => console.error('error', error),
        () => this.eventBus.onStopLoading()
      );
  }

  private requestDeleteProject(projectId: string) {
    this.eventBus.onModalMessage(
      'Are you sure?',
      'There is no way to undo this action.',
      true,
      () => {}, // modal dismissed callback
      () => this.deleteProject(projectId) // modal accepted callback
    );
  }

  private deleteProject(projectId: string) {
    const userId: string = this.userInteractor.getUserId();
    this.eventBus.onStartLoading();
    this.projectInteractor.deleteProject(userId, projectId)
      .subscribe(
        success => {
          this.eventBus.onStopLoading();
          this.eventBus.onModalMessage('', `Project has been deleted from the server.`);
        },
        error => {
          this.eventBus.onStopLoading();
          this.eventBus.onModalMessage('error', error.message);
        }
      );
  }

  private shareProject(projectId: number) {
    const userId: string = this.userInteractor.getUserId();
    this.eventBus.onShareableModal(userId, projectId + '');
  }

  private openMultiView(projectId: number) {
    // const userId = this.userInteractor.getUserId();
    // const path = {
    //   outlets: {
    //     view: 'preview',
    //     modal: 'upload'
    //   }
    // };
    // const extras: NavigationExtras = {
    //   queryParams: {
    //     multiview: `${userId}-${projectId}`
    //   }
    // };
    // this.router.navigate(['/editor', path], extras);

    const userId: string = this.userInteractor.getUserId();
    this.eventBus.onMultiViewModal(userId, projectId + '');
  }

  private isWorkingOnSavedProject(): boolean {
    return this.projectInteractor.isWorkingOnSavedProject();
  }

  private userHasProjects(): boolean {
    return !!this.projectList && this.projectList.length;
  }

  private getActiveProjectName(): string {
    const projectId: string = this.projectInteractor.getProjectId();
    const activeProject = this.projectList.find(project => (project.id === projectId));
    return activeProject && activeProject.name;
  }

  private projectIsSelected(projectId: string): boolean {
    return this.projectInteractor.getProjectId() === projectId;
  }

  private userIsAdmin(): boolean {
    return this.adminInteractor.isAdmin();
  }

  private onExploreClick($event) {
    // this.eventBus.onExploreModal();
    this.router.navigateByUrl('/explore');
  }

  private onAdminClick($event) {
    this.router.navigateByUrl('/admin');
  }

}

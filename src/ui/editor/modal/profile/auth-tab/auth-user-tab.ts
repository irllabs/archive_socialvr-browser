import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminInteractor } from 'core/admin/adminInteractor';
import { ProjectInteractor } from 'core/project/projectInteractor';

import { MetaDataInteractor } from 'core/scene/projectMetaDataInteractor';
import { SceneInteractor } from 'core/scene/sceneInteractor';
import { StorageInteractor } from 'core/storage/storageInteractor';
import { UserInteractor } from 'core/user/userInteractor';
import { Project } from 'data/project/projectModel';
import 'rxjs/add/operator/switchMap';
import { MIME_TYPE_ZIP } from 'ui/common/constants';
import { EventBus } from 'ui/common/event-bus';

const FileSaver = require('file-saver');

@Component({
  selector: 'auth-user-tab',
  styleUrls: ['./auth-user-tab.scss'],
  templateUrl: './auth-user-tab.html',
})
export class AuthUserTab implements OnInit, OnDestroy {
  private projectList = <any>[]; //TODO: move to repo / cache
  private subscription;

  constructor(
    private userInteractor: UserInteractor,
    private projectInteractor: ProjectInteractor,
    private sceneInteractor: SceneInteractor,
    private eventBus: EventBus,
    private storageInteractor: StorageInteractor,
    private metaDataInteractor: MetaDataInteractor,
    private adminInteractor: AdminInteractor,
    private router: Router,
  ) {
  }

  ngOnInit() {
    this.subscription = this.projectInteractor.getProjects().subscribe(
      (projects) => {
        this.projectList = projects.map((p) => new Project(p));
      },
      error => console.error('GET /projects', error),
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  public getUserName(): string {
    return this.userInteractor.getUserName();
  }

  public onLogOutClick() {
    this.userInteractor.logOut();
  }

  public openProject(project: Project) {
    this.eventBus.onStartLoading();
    this.projectInteractor.openProject(project)
      .then(
        () => {
          //reset the current scene
          this.sceneInteractor.setActiveRoomId(null);
          this.eventBus.onSelectRoom(null, false);
          this.metaDataInteractor.setIsReadOnly(false);
          this.eventBus.onStopLoading();
        },
        (error) => {
          console.error('error', error);
          this.eventBus.onStopLoading();
        },
      );
    this.router.navigateByUrl('/editor');
  }

  public downloadProject(projectId: string, projectName: string) {
    this.eventBus.onStartLoading();

    this.projectInteractor.getProjectAsBlob(projectId)
      .subscribe(
        (projectBlob) => {
          const blob = new Blob([projectBlob], { type: MIME_TYPE_ZIP });
          FileSaver.saveAs(blob, `${projectName}.zip`);
          this.eventBus.onStopLoading();
        },
        (error) => {
          this.eventBus.onStopLoading();
          this.eventBus.onModalMessage('error', error.message);
        },
      );
  }

  public shareProject(projectId: number) {
    const userId: string = this.userInteractor.getUserId();
    this.eventBus.onShareableModal(userId, projectId + '');
  }

  public openMultiView(projectId: number) {
    console.log('onOpenMultiView');
    const userId = this.userInteractor.getUserId();
    const queryParams = {
      multiview: `${userId}-${projectId}`,
    };
    this.router.navigate(['editor', 'preview'], { queryParams });
  }

  private isWorkingOnSavedProject(): boolean {
    return this.projectInteractor.isWorkingOnSavedProject();
  }

  private userHasProjects(): boolean {
    return !!this.projectList && this.projectList.length;
  }

  private getActiveProjectName(): string {
    const projectId: string = this.projectInteractor.getProject().id;
    const activeProject = this.projectList.find(project => (project.id === projectId));
    return activeProject && activeProject.name;
  }

  private projectIsSelected(projectId: string): boolean {
    const project: Project = this.projectInteractor.getProject();

    return project && project.id === projectId;
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

import { Component, OnInit } from '@angular/core';
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
export class AuthUserTab implements OnInit {
  private projectList = <any>[]; //TODO: move to repo / cache

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
    this.projectInteractor.getProjects().subscribe(
      (projects) => {
        this.projectList = projects.map((p) => {
          const project = new Project(p);

          project.id = p.id['_binaryString'] ? p.id['_binaryString'] : p.id;
          return project;
        }).sort((a, b) => {
          if (!a.name) {
            return -1;
          }
          if (!b.name) {
            return 1;
          }

          const projectNameA = a.name.toUpperCase();
          const projectNameB = b.name.toUpperCase();

          if (projectNameA < projectNameB) {
            return -1;
          }

          if (projectNameA > projectNameB) {
            return 1;
          }
          
          return 0;
        });
      },
      error => console.error('GET /projects', error),
    );
  }

  public getUserName(): string {
    return this.userInteractor.getUserName();
  }

  public onLogOutClick() {
    this.userInteractor.logOut();
  }

  public openProject(projectId: string) {
    this.eventBus.onStartLoading();
    this.projectInteractor.openProject(projectId)
      .subscribe(
        () => {
          //reset the current scene
          this.sceneInteractor.setActiveRoomId(null);
          this.eventBus.onSelectRoom(null, false);
          this.metaDataInteractor.setIsReadOnly(false);
        },
        error => console.error('error', error),
        () => {
          this.eventBus.onStopLoading();
        },
      );
    this.router.navigateByUrl('/editor');
  }

  public createProject($event) {
    this.eventBus.onStartLoading();

    this.projectInteractor.createProject()
      .subscribe(
        projectData => this.projectList.push(projectData),
        error => console.error('error', error),
        () => this.eventBus.onStopLoading(),
      );
  }

  public updateProject() {
    const userId: string = this.userInteractor.getUserId();
    const projectId: string = this.projectInteractor.getProjectId();

    this.eventBus.onStartLoading();
    this.projectInteractor.updateProject(projectId)
      .subscribe(
        () => null,
        error => console.error('error', error),
        () => this.eventBus.onStopLoading(),
      );
  }

  public requestDeleteProject(projectId: string) {
    this.eventBus.onModalMessage(
      'Are you sure?',
      'There is no way to undo this action.',
      true,
      () => {
      }, // modal dismissed callback
      () => this.deleteProject(projectId), // modal accepted callback
    );
  }

  private deleteProject(projectId: string) {
    this.eventBus.onStartLoading();
    this.projectInteractor.deleteProject(projectId)
      .subscribe(
        success => {
          this.eventBus.onStopLoading();
          this.eventBus.onModalMessage('', `Project has been deleted from the server.`);
        },
        error => {
          this.eventBus.onStopLoading();
          this.eventBus.onModalMessage('error', error.message);
        },
      );
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

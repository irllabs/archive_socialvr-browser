import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminInteractor } from 'core/admin/adminInteractor';
import { ProjectInteractor } from 'core/project/projectInteractor';
import { MetaDataInteractor } from 'core/scene/projectMetaDataInteractor';
import { SceneInteractor } from 'core/scene/sceneInteractor';
import { UserInteractor } from 'core/user/userInteractor';
import { ERROR_OPENING_PROJECT, GROUP_TYPE, SERVER_ERROR } from 'ui/common/constants';

import { EventBus } from 'ui/common/event-bus';

@Component({
  selector: 'admin-user-groups',
  styleUrls: ['./admin-user-groups.scss'],
  templateUrl: './admin-user-groups.html',
})
export class AdminUserGroups {

  private projects = {};

  constructor(
    private userInteractor: UserInteractor,
    private adminInteractor: AdminInteractor,
    private projectInteractor: ProjectInteractor,
    private sceneInteractor: SceneInteractor,
    private metaDataInteractor: MetaDataInteractor,
    private router: Router,
    private eventBus: EventBus,
  ) {
  }

  ngAfterViewInit() {
    if (!this.hasPermission()) {
      return;
    }

    const userGroups = this.getUserGroups();
    userGroups.forEach(group => this.fetchProjectsByGroup(group.id));
  }

  private hasPermission(): boolean {
    return this.userInteractor.isLoggedIn() && this.adminInteractor.isAdmin();
  }

  private getUserGroups(): any[] {
    return this.adminInteractor.getAdminGroups();
  }

  private openProject(project) {
    this.eventBus.onStartLoading();
    this.projectInteractor.openProject(project)
      .then(
        () => {
          this.sceneInteractor.setActiveRoomId(null);
          this.eventBus.onSelectRoom(null, false);
          this.eventBus.onStopLoading();
          this.metaDataInteractor.setIsReadOnly(true);
          this.router.navigateByUrl('/editor');
        },
        () => {
          this.eventBus.onStopLoading();
          this.eventBus.onModalMessage(ERROR_OPENING_PROJECT, SERVER_ERROR);
        },
      );
  }

  private fetchProjectsByGroup(groupId: string) {
    return this.adminInteractor.getAllProjectsInGroup(groupId)
      .subscribe(
        projectList => this.projects[groupId] = projectList.results,
        error => console.log('error', error),
      );
  }

  private getGroupProjects(groupId: string) {
    return this.projects[groupId]
      && this.projects[groupId].projects_from_users || [];
  }

  private getExternalProjects(groupId: string) {
    return this.projects[groupId] &&
      this.projects[groupId].external_projects || [];
  }

  private onCheckboxChange($event, groupId: string, projectId: string, project: any) {
    this.adminInteractor.setProjectInGroup(groupId, projectId, $event.value, GROUP_TYPE.FEATURED)
      .subscribe(
        response => project.isFeatured = $event.value,
        error => console.log('error', error),
      );
  }

  private removeExternalProject(groupId: string, projectId: string) {
    this.adminInteractor.setProjectInGroup(groupId, projectId, false, GROUP_TYPE.EXTERNAL)
      .subscribe(
        response => {
          this.projects[groupId].external_projects = this.projects[groupId].external_projects
            .filter(project => project.projectId !== projectId);
        },
        error => console.log('error', error),
      );
  }

  onAddProject($event) {
    const listContainsProject = this.projects[$event.groupId].external_projects
      .some(project => project.projectId === $event.project.id);
    if (!listContainsProject) {
      this.projects[$event.groupId].external_projects.push($event.project);
    }
  }

}

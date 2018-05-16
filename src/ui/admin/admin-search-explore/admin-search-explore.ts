import { Component, EventEmitter, Output } from '@angular/core';
import { AdminInteractor } from 'core/admin/adminInteractor';

import { ProjectInteractor } from 'core/project/projectInteractor';
import { SearchInteractor } from 'core/search/searchInteractor';
import { UserInteractor } from 'core/user/userInteractor';
import { GROUP_TYPE } from 'ui/common/constants';
import { ShareableLoader } from 'ui/common/shareable-loader';

@Component({
  selector: 'admin-search-explore',
  styleUrls: ['./admin-search-explore.scss'],
  templateUrl: './admin-search-explore.html',
})
export class AdminSearchExplore {

  @Output() onAddProject = new EventEmitter();

  private searchTerm: string = '';
  private matchingResults = [];
  private searchLabel = '';

  constructor(
    private projectInteractor: ProjectInteractor,
    private searchInteractor: SearchInteractor,
    private shareableLoader: ShareableLoader,
    private userInteractor: UserInteractor,
    private adminInteractor: AdminInteractor,
  ) {
  }

  ngAfterViewInit() {
    if (!this.hasPermission()) {
      return;
    }
  }

  private hasPermission(): boolean {
    return this.userInteractor.isLoggedIn() && this.adminInteractor.isAdmin();
  }

  private getUserGroups(): any[] {
    return this.adminInteractor.getAdminGroups();
  }

  getSearchModelProperty(): string {
    return '';
  }

  setSearchViewModel($event) {
    this.searchTerm = $event.text;
  }

  onSearchClick($event) {
    if (!this.searchTerm) {
      return;
    }
    const cleansedQuery = this.searchTerm
      .split(',')
      .map(item => item.trim())
      .join(',');
    this.searchPublicProjects(cleansedQuery);
    this.searchLabel = this.searchTerm;
  }

  onProjectClick(projectUrl: string) {
    this.shareableLoader.openDecodedProject(projectUrl);
  }

  searchPublicProjects(query: string) {
    this.searchInteractor.searchPublicProjects(query)
      .subscribe(
        projects => this.matchingResults = projects,
        error => console.log('error', error),
      );
  }

  showNoResults(): boolean {
    return this.searchLabel && !this.matchingResults.length;
  }

  getSearchResultTitle(): string {
    const numResults = this.matchingResults.length;
    const pluralize = numResults === 1 ? '' : 's';
    return `${numResults} search result${pluralize} for`;
  }

  toggleProjectInGroup(project, group) {
    const projectId = project.projectId;
    const groupId = group.id;
    this.adminInteractor.setProjectInGroup(groupId, projectId, true, GROUP_TYPE.EXTERNAL)
      .subscribe(
        response => this.onAddProject.emit({ groupId, project }),
        error => console.log('error', error),
      );
  }

}

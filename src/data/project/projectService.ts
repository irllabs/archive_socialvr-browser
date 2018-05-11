import { Injectable } from '@angular/core';

@Injectable()
export class ProjectService {

  private projectId: string;

  constructor() {
  }

  public getProjectId(): string {
    return this.projectId;
  }

  public setProjectId(projectId: string) {
    this.projectId = projectId;
  }

  public isWorkingOnSavedProject(): boolean {
    return !!this.projectId;
  }

  public createProject(projectName: string, projectTags: string, storyFile: any, thumbnail: string) {

  }
}

import {Injectable} from '@angular/core';

@Injectable()
export class ProjectService {

  private projectId: string;

  constructor() {}

  getProjectId(): string {
    return this.projectId;
  }

  setProjectId(projectId: string) {
    this.projectId = projectId;
  }

  isWorkingOnSavedProject(): boolean {
    return !!this.projectId;
  }

}

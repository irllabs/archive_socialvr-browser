import { Injectable } from '@angular/core';
import { Project } from './projectModel';

@Injectable()
export class ProjectService {
  private _project: Project;

  constructor() {
  }

  public getProjectId(): string {
    return this._project ? this._project.id : null;
  }

  public getProject(): Project {
    return this._project;
  }

  public setProject(project: Project) {
    this._project = project;
  }

  public isWorkingOnSavedProject(): boolean {
    return !!this.getProjectId();
  }
}

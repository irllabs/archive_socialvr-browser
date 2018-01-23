import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

import {DeserializationService} from 'data/storage/deserializationService';
import {SerializationService} from 'data/storage/serializationService';
import {ApiService} from 'data/api/apiService';
import {RoomManager} from 'data/scene/roomManager';
import {ProjectService} from 'data/project/projectService';
import {AssetManager} from 'data/asset/assetManager';

import 'rxjs/add/operator/switchMap';

@Injectable()
export class ProjectInteractor {

  constructor(
    private deserializationService: DeserializationService,
    private serializationService: SerializationService,
    private roomManager: RoomManager,
    private apiService: ApiService,
    private projectService: ProjectService,
    private assetManager: AssetManager
  ) {}

  getProjects(userId: string) {
    return this.apiService.getProjects(userId);
  }

  updateSharableStatus(userId: string, projectId: string, isPublic: boolean) {
    return this.apiService.updateSharableStatus(userId, projectId, isPublic);
  }

  getProjectData(userId: string, projectId: string) {
    return this.apiService.getProjectData(userId, projectId);
  }

  openProject(userId: string, projectId: string) {
    console.log('openProject');
    return this.apiService.getProjectUrl(userId, projectId)
      .switchMap(signedProjectUrl => this.apiService.getProject(signedProjectUrl))
      .switchMap(projectArrayBuffer => {
        console.log('projectArrayBuffer', projectArrayBuffer);
        return this.deserializationService.unzipStoryFile(projectArrayBuffer);
      })
      .do(projectData => {
        this.assetManager.clearAssets();
        console.log('clearAssets');
        this.projectService.setProjectId(projectId);
        console.log('setProjectId');
      });
  }

  openPublicProject(projectUrl: string) {
    return this.apiService.getProject(projectUrl)
      .switchMap(projectArrayBuffer => this.deserializationService.unzipStoryFile(projectArrayBuffer))
      .do(projectData => {
        this.assetManager.clearAssets();
        this.projectService.setProjectId(null);
      });
  }

  createProject(userId: string) {
    const projectName: string = this.roomManager.getProjectName();
    const projectTags: string = this.roomManager.getProjectTags();
    const homeroomThumbnail: string = this.getHomeroomThumbnail();
    return this.serializationService.zipStoryFile()
      .switchMap(zipFile => this.apiService.createProject(userId, projectName, projectTags, zipFile, homeroomThumbnail))
      .do(projectData => this.projectService.setProjectId(projectData.id));
  }

  updateProject(userId: string, projectId: string) {
    const projectName: string = this.roomManager.getProjectName();
    const projectTags: string = this.roomManager.getProjectTags();
    const homeroomThumbnail: string = this.getHomeroomThumbnail();
    return this.serializationService.zipStoryFile()
      .switchMap(zipFile => this.apiService.updateProject(userId, projectId, projectName, projectTags, zipFile, homeroomThumbnail));
  }

  deleteProject(userId: string, projectId: string) {
    return this.apiService.deleteProject(userId, projectId);
  }

  getProjectAsBlob(userId: string, projectId: string): Observable<Blob> {
    return this.apiService.getProjectUrl(userId, projectId)
      .switchMap(signedProjectUrl => this.apiService.getProject(signedProjectUrl));
  }

  getProjectId(): string {
    return this.projectService.getProjectId();
  }

  setProjectId(projectId: string) {
    this.projectService.setProjectId(projectId);
  }

  isWorkingOnSavedProject(): boolean {
    return this.projectService.isWorkingOnSavedProject();
  }

  // get base64 homeroom thumbnail
  private getHomeroomThumbnail(): string {
    const homeRoomId = this.roomManager.getHomeRoomId();
    const homeRoom = this.roomManager.getRoomById(homeRoomId);
    const dataUrl = homeRoom.getThumbnailImage();
    if (!dataUrl) {
      return '';
    }
    const cleanedDataUrl: string = dataUrl.changingThisBreaksApplicationSecurity ?
      dataUrl.changingThisBreaksApplicationSecurity : dataUrl;
    return cleanedDataUrl.substring(cleanedDataUrl.indexOf(',') + 1);
  }

}

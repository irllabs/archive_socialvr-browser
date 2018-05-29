import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { AngularFireStorage } from 'angularfire2/storage';
import { ApiService } from 'data/api/apiService';
import { AssetManager } from 'data/asset/assetManager';
import { Project, PROJECT_STATES } from 'data/project/projectModel';
import { ProjectService } from 'data/project/projectService';
import { RoomManager } from 'data/scene/roomManager';

import { DeserializationService } from 'data/storage/deserializationService';
import { SerializationService } from 'data/storage/serializationService';
import { UserService } from 'data/user/userService';
import 'rxjs/add/operator/do';

import 'rxjs/add/operator/switchMap';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { MediaFile } from '../../data/scene/entities/mediaFile';


@Injectable()
export class ProjectInteractor {
  private get _projectsCollection(): AngularFirestoreCollection<Project> {
    const userId = this.userService.getUserId();

    if (userId) {
      return this.afStore.collection<Project>('projects', ref => ref.where('userId', '==', userId).orderBy('name'));
    }
  };

  private get _projects(): Observable<Project[]> {
    if (this._projectsCollection) {
      return this._projectsCollection.valueChanges();
    }
  };

  constructor(
    private deserializationService: DeserializationService,
    private serializationService: SerializationService,
    private roomManager: RoomManager,
    private apiService: ApiService,
    private projectService: ProjectService,
    private assetManager: AssetManager,
    private userService: UserService,
    private afStore: AngularFirestore,
    private afStorage: AngularFireStorage,
  ) {
  }

  public getProjects() {
    return this._projects;
  }

  public updateSharableStatus(projectId: string, isPublic: boolean): Observable<any> {
    return fromPromise(this._projectsCollection.doc(projectId).update({ isPublic }));
  }

  public getProjectData(projectId: string): Observable<Project> {
    return this._projectsCollection.doc<Project>(projectId).valueChanges();
  }

  public openProject(project: Project) {
    return this._openProject(project);
  }

  public openProjectById(projectId: string) {
    return this._projectsCollection
      .doc(projectId).valueChanges()
      .first()
      .switchMap((obj: any) => this._openProject(new Project(obj)));
  }

  public openPublicProject(projectId: string) {
    return this.getProjectData(projectId).toPromise().then((response) => {
      const project = new Project(response);

      return this._openProject(project);
    });
  }

  public createProject() {
    const projectId = this.afStore.createId();
    const project = new Project({
      id: projectId,
    });

    return this._saveProject(project)
      .then((project: Project) => {
        this.projectService.setProject(project);
      });
  }

  public updateProject(project: Project) {
    return this._saveProject(project);
  }

  public deleteProject(projectId: string) {
    return fromPromise(this._projectsCollection.doc(projectId).delete());
  }

  // TODO: fix it
  public getProjectAsBlob(projectId: string): Observable<ArrayBuffer> {
    const userId = this.userService.getUserId();

    return this.afStorage
      .ref(`projects/${projectId}/fileStory.zip`)
      .getDownloadURL()
      .switchMap((fileStoreUrl: string) => this.apiService.loadBinaryData(fileStoreUrl));
  }

  public getProject(): Project {
    return this.projectService.getProject();
  }

  public setProject(project: Project) {
    this.projectService.setProject(project);
  }

  public isWorkingOnSavedProject(): boolean {
    return this.projectService.isWorkingOnSavedProject();
  }

  public searchPublicProjects(query: string) {
    const tags = (query || '').trim()
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    if (tags.length == 0) {
      return fromPromise(Promise.resolve([]));
    }

    return forkJoin(tags.reduce((observers, tag) => {
      const observer = this.afStore
        .collection('projects', (ref) => {
          return ref
            .where('isPublic', '==', true)
            .where(`tags.${tag}`, '==', true);
        })
        .valueChanges()
        .first();

      return observers.concat(observer);
    }, []))
      .map((projectsSet) => {
        const result = [];

        return result.concat.apply(result, projectsSet);
      })
      .map((projects) => {
        const uniqueProject = [];
        const ids = [];

        projects.forEach((p) => {
          if (ids.indexOf(p.id) === -1) {
            uniqueProject.push(new Project(p));
            ids.push(p.id);
          }
        });

        return uniqueProject;
      });
  }

  private _openProject(project: Project) {
    return this.deserializationService
      .deserializeProject(project)
      .then((downloadRestAssets) => {
        this.assetManager.clearAssets();
        this.projectService.setProject(project);

        downloadRestAssets();
      });
  }

  private _saveProject(project: Project) {
    const projectName: string = this.roomManager.getProjectName();
    const projectTags: string = this.roomManager.getProjectTags();
    const userName = this.userService.getUserName();
    const userId = this.userService.getUserId();
    const homeRoomId = this.roomManager.getHomeRoomId();
    const homeRoom = this.roomManager.getRoomById(homeRoomId);
    const thumbnailMediaFile: MediaFile = homeRoom.getThumbnail().getMediaFile();
    const allMediaFiles = this.serializationService.extractAllMediaFiles();
    const deleteMediaFiles = allMediaFiles.filter((mediaFile: MediaFile) => mediaFile.hasRemoteFileToDelete());
    const uploadMediaFiles = allMediaFiles
      .filter((mediaFile: MediaFile) => mediaFile.hasBinaryDataToUpload())
      .map((mediaFile: MediaFile) => {
        mediaFile.setRemoteFile(`projects/${project.id}/${mediaFile.getFileName()}`);

        return mediaFile;
      });
    const story = this.serializationService.buildProjectJson();

    if (!project.userId) {
      project.userId = userId;
      project.user = userName;
    } else if (project.userId === userId) {
      project.user = userName;
    }

    project.name = projectName;
    project.setTags(projectTags);
    project.story = story;
    project.thumbnailUrl = `projects/${project.id}/${thumbnailMediaFile.getFileName()}`;

    const projectRef = this._projectsCollection.doc(project.id);

    return projectRef.set(project.toJson())
      .then(() => this._deleteMediaFiles(deleteMediaFiles))
      .then(() => this._uploadMediaFiles(uploadMediaFiles))
      .then(() => {
        return projectRef.update({
          state: PROJECT_STATES.ASSETS_UPLOADED,
        });
      })
      .then(() => {
        return project;
      });
  }

  private async _deleteMediaFiles(mediaFiles) {
    for (let i = 0; i < mediaFiles.length; i++) {
      const mediaFile = mediaFiles[i];

      await this.afStorage.ref(mediaFile.storedRemoteFile)
        .delete().toPromise()
        .then(() => mediaFile.setStoredRemoteFile(null))
        .catch((error) => {
          console.log('Can\'t delete file from Storage:', mediaFile);
          console.log(error);
        });
    }
  }

  private async _uploadMediaFiles(mediaFiles) {
    for (let i = 0; i < mediaFiles.length; i++) {
      const mediaFile: MediaFile = mediaFiles[i];
      const task = this.afStorage.upload(mediaFile.getRemoteFile(), mediaFile.getBlob());

      await task.downloadURL().toPromise()
        .then(() => {
          mediaFile.setStoredRemoteFile(mediaFile.getRemoteFile());

          return mediaFile;
        })
        .catch((error) => {
          console.log('Can\'t upload file to Storage:', mediaFile);
          console.log(error);
        });
    }
  }
}

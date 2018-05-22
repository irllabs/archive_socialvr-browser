import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { AngularFireStorage } from 'angularfire2/storage';
import { ApiService } from 'data/api/apiService';
import { AssetManager } from 'data/asset/assetManager';
import { Project } from 'data/project/projectModel';
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


@Injectable()
export class ProjectInteractor {
  private get _projectsCollection(): AngularFirestoreCollection<Project> {
    const userId = this.userService.getUserId();

    if (userId) {
      return this.afStore.collection<Project>('projects', ref => ref.where('userId', '==', userId));
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

  public openProject(projectId: string) {
    return this._projectsCollection
      .doc(projectId).valueChanges()
      .first()
      .switchMap((project: Project) => this._openProject(projectId, project.storyFileUrl));
  }

  public openPublicProject(projectDocRef: string) {
    return this._openProject(null, projectDocRef);
  }

  public createProject() {
    const projectId = this.afStore.createId();

    return this._saveProject(projectId).do(() => {
      this.projectService.setProjectId(projectId);
    });
  }

  public updateProject(projectId: string) {
    return this._saveProject(projectId);
  }

  public deleteProject(projectId: string) {
    return fromPromise(this._projectsCollection.doc(projectId).delete());
  }

  public getProjectAsBlob(projectId: string): Observable<ArrayBuffer> {
    const userId = this.userService.getUserId();

    return this.afStorage
      .ref(`projects/${projectId}/fileStory.zip`)
      .getDownloadURL()
      .switchMap((fileStoreUrl: string) => this.apiService.loadBinaryData(fileStoreUrl));
  }

  public getProjectId(): string {
    return this.projectService.getProjectId();
  }

  public setProjectId(projectId: string) {
    this.projectService.setProjectId(projectId);
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

  private _openProject(projectId: string, storyFileUrl: string) {
    return this.afStorage.ref(storyFileUrl).getDownloadURL()
      .switchMap((fileStoreUrl: string) => this.apiService.loadBinaryData(fileStoreUrl))
      .switchMap((projectArrayBuffer) => this.deserializationService.unzipStoryFile(projectArrayBuffer))
      .do(() => {
        this.assetManager.clearAssets();
        this.projectService.setProjectId(projectId);
      });
  }

  private _saveProject(projectId) {
    const projectName: string = this.roomManager.getProjectName();
    const projectTags: string = this.roomManager.getProjectTags();
    const user = this.userService.getUser();
    const userId = this.userService.getUserId();
    const fileRefs = {
      storyFile: `projects/${projectId}/fileStory.zip`,
      thumbnail: null,
    };

    const observers = [
      this.serializationService
        .zipStoryFile()
        .switchMap((zipFile) => {
          return this.afStorage.upload(fileRefs.storyFile, zipFile).downloadURL();
        }),
    ];

    observers.push(
      this._getHomeRoomThumbnail().switchMap((blob) => {
        fileRefs.thumbnail = `projects/${projectId}/thumbnail.${blob.type.split('/')[1]}`;

        return this.afStorage
          .upload(fileRefs.thumbnail, blob)
          .downloadURL();
      }),
    );

    return forkJoin(observers).switchMap(() => {
      const project = new Project({
        userId,
        id: projectId,
        user: user.displayName,
        name: projectName,
        storyFileUrl: fileRefs.storyFile,
        thumbnailUrl: fileRefs.thumbnail,
      });

      project.setTags(projectTags);

      console.log('save:', project.toJson());

      return this._projectsCollection.doc(projectId).set(project.toJson());
    });
  }

  // get base64 homeroom thumbnail
  private _getHomeRoomThumbnail(): Observable<Blob> {
    const homeRoomId = this.roomManager.getHomeRoomId();
    const homeRoom = this.roomManager.getRoomById(homeRoomId);
    const dataUrl = homeRoom.getThumbnailImage(true);


    return fromPromise(new Promise((resolve, reject) => {
      const img = new Image();

      img.onerror = reject;
      img.onload = function onload() {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(resolve);
      };

      img.src = dataUrl;
    }));
  }
}

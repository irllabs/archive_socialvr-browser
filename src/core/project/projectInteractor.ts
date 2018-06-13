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
import { Audio } from '../../data/scene/entities/audio';
import { MediaFile } from '../../data/scene/entities/mediaFile';
import { Room } from '../../data/scene/entities/room';
import { MetaDataInteractor } from '../scene/projectMetaDataInteractor';

const JSZip = require('jszip');

const AUTOSAVE_PERIOD = 60 * 1000;

@Injectable()
export class ProjectInteractor {
  private _autoSaveTimer;
  private _saving: boolean = false;

  private get _projectsCollection(): AngularFirestoreCollection<Project> {
    const userId = this.userService.getUserId();

    if (userId) {
      return this.afStore.collection<Project>('projects', ref => ref.where('userId', '==', userId).orderBy('nameLower'));
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
    private projectMetaDataInteractor: MetaDataInteractor,
  ) {
  }

  private _restartAutosaver() {
    if (this._autoSaveTimer) {
      clearInterval(this._autoSaveTimer);
    }

    this._autoSaveTimer = setInterval(() => {
      this._autoSave();
    }, AUTOSAVE_PERIOD);
  }

  private _autoSave(): void {
    if (!this._saving && this.projectMetaDataInteractor.hasUnsavedChanges && this.projectService.isWorkingOnSavedProject()) {
      this.updateProject(this.getProject());
    }
  }

  public getProjects() {
    return this._projects;
  }

  public updateSharableStatus(projectId: string, isPublic: boolean): Promise<any> {
    return this._projectsCollection.doc(projectId).update({ isPublic });
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
    const collectionRef = this.afStore.collection<Project>('projects');

    return collectionRef.doc<Project>(projectId).valueChanges().first().toPromise()
      .then((response) => {
        const project = new Project(response);

        return this._openProject(project, false);
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

  public getProjectAsBlob(project: Project): Promise<ArrayBuffer> {
    const story = project.story;
    const remoteFiles = this.deserializationService.extractAllRemoteFiles(story);
    const homeRoomId = (story.rooms.find(room => room.uuid === story.homeRoomId) || story.rooms[0]).uuid;
    const rooms: Room[] = [];
    const zip = new JSZip();
    const soundtrack: Audio = new Audio();

    const promises = [
      this.deserializationService
        .loadRemoteFiles(remoteFiles)
        .then((mediaFiles: MediaFile[]) => {
          this.deserializationService
            .deserializeRooms(story.rooms, homeRoomId, mediaFiles)
            .forEach(room => rooms.push(room));

          // get soundtrack
          if (story.soundtrack) {
            const soundtrackMediaFile = mediaFiles.find(mediaFile => mediaFile.getFileName() === story.soundtrack.file);

            if (soundtrackMediaFile) {
              soundtrack.setMediaFile(soundtrackMediaFile);
            }
          }

          return this.serializationService.buildAssetDirectories(zip, rooms);
        })
        .then(() => {
          const homeRoom = rooms.find(room => room.getId() === homeRoomId);

          return Promise.all([
            this.serializationService.zipHomeRoomImage(zip, homeRoom),
            this.serializationService.zipProjectSoundtrack(zip, soundtrack),
          ]);
        }),


      this.serializationService.zipStoryFiles(zip, story),
    ];

    return Promise.all(promises).then(() => zip.generateAsync({ type: 'blob' }));
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

  private _openProject(project: Project, quick = true) {
    return this.deserializationService
      .deserializeProject(project, quick)
      .then((downloadRestAssets) => {
        this.assetManager.clearAssets();
        this.projectService.setProject(project);

        return downloadRestAssets().then(() => {
          this._restartAutosaver();
        });
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

    this._saving = true;

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
        this.projectMetaDataInteractor.onProjectSaved();
        this._saving = false;
        this._restartAutosaver();
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

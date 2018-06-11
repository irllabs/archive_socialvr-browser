import { Injectable } from '@angular/core';
import { AngularFireStorage } from 'angularfire2/storage';

import { ApiService } from 'data/api/apiService';
import { Room } from 'data/scene/entities/room';

import { RoomManager } from 'data/scene/roomManager';
import { PropertyBuilder } from 'data/scene/roomPropertyBuilder';

import 'rxjs/add/observable/fromPromise';

import { Observable } from 'rxjs/Observable';

import {
  MIME_TYPE_AAC,
  MIME_TYPE_JPEG,
  MIME_TYPE_JPG,
  MIME_TYPE_MP3,
  MIME_TYPE_PNG,
  MIME_TYPE_WAV,
  MIME_TYPE_XM4A,
  STORY_VERSION,
} from 'ui/common/constants';
import { FileLoaderUtil } from 'ui/editor/util/fileLoaderUtil';
import { DEFAULT_IMAGE_PATH, STORY_FILE_YAML, UINT8ARRAY } from '../../ui/common/constants';
import { Project } from '../project/projectModel';
import { MediaFile } from '../scene/entities/mediaFile';
import { Universal } from '../scene/entities/universal';
import { reverbList } from '../scene/values/reverbList';
import { resizeImage } from '../util/imageResizeService';
import { deserializeLocationVector } from '../util/vector';
import deserializeOldStory from './legacy/deserializeOldStory';

const JSZip = require('jszip');
const JsYaml = require('js-yaml');

@Injectable()
export class DeserializationService {
  private zip = new JSZip();
  private _cachedStoryFile: any;

  constructor(
    private roomManager: RoomManager,
    private propertyBuilder: PropertyBuilder,
    private fileLoaderUtil: FileLoaderUtil,
    private apiService: ApiService,
    private afStorage: AngularFireStorage,
  ) {
    this._cachedStoryFile = {};
  }

  public deserializeProject(project: Project, quick: boolean = true) {
    const story = project.story;
    const rootRemoteFiles = this._extractRootRemoteFiles(story);
    const roomsRemoteFiles = quick ?  this._extractHomeRoomRemoteFiles(story) : this._extractRoomsRemoteFiles(story.rooms);

    return Promise.all([
      this.loadRemoteFiles(rootRemoteFiles),
      this.loadRemoteFiles(roomsRemoteFiles),
    ])
      .then(([rootMediaFiles, homeRoomMediaFiles]) => {
        return this._deserializeProject(story, rootMediaFiles.concat(homeRoomMediaFiles), quick);
      });
  }

  public unzipStoryFile(zipFile) {
    return Observable.fromPromise(
      this.zip.loadAsync(zipFile).then(file => this._deserializeProjectFromZipFile(file)),
    );
  }

  public extractAllRemoteFiles(story) {
    return this._extractRootRemoteFiles(story).concat(this._extractRoomsRemoteFiles(story.rooms));
  }

  public async loadRemoteFiles(remoteFiles) {
    const mediaFiles = [];

    for (let i = 0; i < remoteFiles.length; i++) {
      const remoteFile = remoteFiles[i];
      const fileName = remoteFile.file;
      const mimeType = this.getFileMimeType(fileName);

      await this.afStorage
        .ref(remoteFile.remoteFile)
        .getDownloadURL().toPromise()
        .then((fileStoreUrl) => this.apiService.loadBinaryData(fileStoreUrl).toPromise())
        .then((data: ArrayBuffer) => new Blob([data], { type: mimeType }))
        .then((blob) => this.fileLoaderUtil.getBinaryFileData(blob))
        .then((binaryData) => {
          return new MediaFile({
            mimeType,
            fileName,
            remoteFile: remoteFile.remoteFile,
            binaryFileData: binaryData,
          });
        })
        .then(mediaFile => mediaFiles.push(mediaFile))
        .catch((error) => {
          console.log('Error to load remote file:', remoteFile);
          console.log(error);
        });
    }

    return mediaFiles;
  }

  public deserializeRooms(roomsData, homeRoomId, mediaFiles, quick = false): Room[] {
    const rooms: Room[] = [];

    roomsData.forEach((roomData) => {
      const roomId = roomData.uuid;
      const isLoadedAssets = !quick || roomId === homeRoomId; //homeRoom.uuid;
      const room: Room = <Room> this.propertyBuilder.setBaseProperties(roomData, new Room());

      room.setAssetsLoadedState(isLoadedAssets);
      room.setReverb(roomData.reverb || reverbList[0]);

      if (roomData.front) {
        room.setLocation(deserializeLocationVector(roomData.front));
      }

      // background image
      if (roomData.image) {
        const bgImageMediaFile = mediaFiles.find(mediaFile => mediaFile.getFileName() === roomData.image.file);

        if (bgImageMediaFile) {
          room.getBackgroundImage().setMediaFile(bgImageMediaFile);
        } else {
          const binaryData = quick ? null : DEFAULT_IMAGE_PATH;

          room.setBackgroundImageBinaryData(binaryData);
        }
      } else {
        room.getBackgroundImage().setBinaryFileData(DEFAULT_IMAGE_PATH);
      }

      // background thumbnail
      if (roomData.thumbnail) {
        const thumbnailMediaFile = mediaFiles.find(mediaFile => mediaFile.getFileName() === roomData.thumbnail.file);

        if (thumbnailMediaFile) {
          room.getThumbnail().setMediaFile(thumbnailMediaFile);
        }
      }

      if (!room.getThumbnail().hasAsset() && isLoadedAssets) {
        const bgImageBinaryData = room.getBackgroundImage().getBinaryFileData();

        resizeImage(bgImageBinaryData, 'projectThumbnail')
          .then(imageData => room.getThumbnail().setBinaryFileData(imageData))
          .catch(error => console.log('generate thumbnail error', error));
      }

      // background audio
      if (roomData.ambient) {
        const ambientMediaFile = mediaFiles.find(mediaFile => mediaFile.getFileName() === roomData.ambient.file);

        if (ambientMediaFile) {
          room.getBackgroundAudio().setMediaFile(ambientMediaFile);
          room.setBackgroundAudioVolume(roomData.bgVolume);
        }
      }

      // narrator audio
      if (roomData.narrator) {
        const intro = roomData.narrator.intro;
        const reprise = roomData.narrator.reprise;
        const narrator = room.getNarrator();

        narrator.setVolume(roomData.narrator.volume);

        if (intro) {
          const introMediaFile = mediaFiles.find(mediaFile => mediaFile.getFileName() === intro.file);

          if (introMediaFile) {
            narrator.getIntroAudio().setMediaFile(introMediaFile);
          }
        }

        if (reprise) {
          const repriseMediaFile = mediaFiles.find(mediaFile => mediaFile.getFileName() === reprise.file);

          if (repriseMediaFile) {
            narrator.getReturnAudio().setMediaFile(repriseMediaFile);
          }
        }
      }

      // doors
      (roomData.doors || []).concat(roomData.autoDoors || [])
        .map(doorJson => this.propertyBuilder.doorFromJson(doorJson))
        .forEach(door => room.addDoor(door));

      // hotspots
      (roomData.universal || [])
        .forEach((universalJson) => {
          const universal: Universal = <Universal> this.propertyBuilder.setBaseProperties(universalJson, new Universal());
          const imageMediaFile = universalJson.imageFile && mediaFiles.find(mediaFile => mediaFile.getFileName() === universalJson.imageFile);
          const audioMediaFile = universalJson.audioFile && mediaFiles.find(mediaFile => mediaFile.getFileName() === universalJson.audioFile);

          universal.textContent = universalJson.text;
          universal.volume = universalJson.volume;
          universal.loop = universalJson.loop;

          if (imageMediaFile) {
            universal.setImageMediaFile(imageMediaFile);
          }

          if (audioMediaFile) {
            universal.setAudioMediaFile(audioMediaFile);
          }

          room.addUniversal(universal);
        });


      rooms.push(room);
    });

    return rooms;
  }

  public getFileMimeType(fileName) {
    const fileType = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
    const fileMap = {
      '.mp3': MIME_TYPE_MP3,
      '.wav': MIME_TYPE_WAV,
      '.aac': MIME_TYPE_AAC,
      '.m4a': MIME_TYPE_XM4A,
      '.png': MIME_TYPE_PNG,
      '.jpg': MIME_TYPE_JPG,
      '.jpeg': MIME_TYPE_JPEG,
    };

    return fileMap[fileType] || MIME_TYPE_PNG;
  }

  private _deserializeProjectFromZipFile(jsZipData) {
    const fileMap = jsZipData.files;
    const jsonStoryFilePath: string = Object.keys(fileMap).find(path => path.endsWith('.json'));
    const yamlStoryFilePath: string = Object.keys(fileMap).find(path => path.endsWith('.yml')) || STORY_FILE_YAML;
    const storyFile = fileMap[jsonStoryFilePath || yamlStoryFilePath];

    return this._parseStoryFile(storyFile)
      .then((storyJson) => {
        switch (storyJson.version) {
          case STORY_VERSION: {
            return this._loadMediaFiles(storyJson, fileMap).then((mediaFiles) => this._deserializeProject(storyJson, mediaFiles, false));
          }
          default: {
            return deserializeOldStory(this, storyJson, fileMap);
          }
        }
      });
  }

  private _parseStoryFile(storyFile) {
    return storyFile.async('string').then((storyFileString) => {
      if (storyFile.name.endsWith('.json')) {
        return JSON.parse(storyFileString);
      } else {
        try {
          //remove room property descriptions from yaml file (ex: - !image, - !door)
          const bangDescriptionRegex = /!\w+\n/g;
          const newLineStoryYaml: string = storyFileString.replace(/\r\n/g, '\n');
          const cleanedStoryYaml: string = newLineStoryYaml.replace(bangDescriptionRegex, '\n');

          return JsYaml.load(cleanedStoryYaml);
        }
        catch (error) {
          console.error(error);
          return;
        }
      }
    });
  }

  private async _loadMediaFiles(storyJson, fileMap): Promise<MediaFile[]> {
    const allRemoteFiles = this.extractAllRemoteFiles(storyJson);
    const remoteFiles = [];
    const localFiles = [];
    const files = Object.keys(fileMap)
      .filter(fileKey => !fileKey.endsWith('.yml'))
      .filter(fileKey => !fileKey.endsWith('.json'))
      .map(fileKey => fileMap[fileKey])
      .filter(file => !file.dir);

    allRemoteFiles.forEach((rf) => {
      const hasInZip = files.find(f => f.name.indexOf(rf.filePath) > -1);

      if (!hasInZip) {
        remoteFiles.push(rf);
      } else {
        localFiles.push(hasInZip);
      }
    });

    const mediaFiles = await this.loadRemoteFiles(remoteFiles);
    const localMediaFiles = await this._loadLocalFiles(localFiles);

    return mediaFiles.concat(localMediaFiles);
  }

  private _extractRootRemoteFiles(story) {
    const remoteFiles = [];

    if (story) {
      // extract soundtrack
      if (story.soundtrack && story.soundtrack.remoteFile) {
        remoteFiles.push({
          file: story.soundtrack.file,
          filePath: story.soundtrack.file,
          remoteFile: story.soundtrack.remoteFile,
        });
      }
    }

    return remoteFiles;
  }

  private _extractHomeRoomRemoteFiles(story) {
    const rooms = story.rooms;

    if (rooms && rooms.length > 0) {
      const homeRoomId = story.homeRoomId;
      const homeRoom = rooms.find(room => room.uuid === homeRoomId) || rooms[0];

      return this._extractRoomsRemoteFiles([homeRoom]);
    }

    return [];
  }

  private _extractRestRoomsMediaFiles(story, homeRoom) {
    const mediaFilesByRoom = [];
    const mediaFiles = [];

    const rooms = story.rooms;

    if (rooms && rooms.length > 0) {
      rooms
        .filter(room => room.uuid !== homeRoom.uuid)
        .forEach((room) => {
          const roomId = room.uuid;
          const roomMediaFiles = this._extractRoomsRemoteFiles([room]).map((remoteFile) => {
            const mimeType = this.getFileMimeType(remoteFile.file);

            return new MediaFile({
              mimeType,
              fileName: remoteFile.file,
              remoteFile: remoteFile.remoteFile,
              binaryFileData: null,
            });
          });

          mediaFilesByRoom.push({
            roomId,
            roomMediaFiles,
          });

          roomMediaFiles.forEach((mediaFile) => mediaFiles.push(mediaFile));
        });
    }

    return { mediaFilesByRoom, mediaFiles };
  }

  private _extractRoomsRemoteFiles(rooms) {
    const remoteFiles = [];

    (rooms || []).forEach((room) => {
      const universalRemoteFiles = (room.universal || []).reduce((acc, universal) => {
        return acc.concat([
          {
            file: universal.imageFile,
            remoteFile: universal.remoteImageFile,
          },
          {
            file: universal.audioFile,
            remoteFile: universal.remoteAudioFile,
          },
        ]);
      }, []);
      const assets = [
        ...universalRemoteFiles,
        room.ambient,
        room.image,
        room.thumbnail || {},
        (room.narrator || {}).intro,
        (room.narrator || {}).reprise,
      ].filter(a => !!a && !!a.remoteFile);

      assets.forEach((asset) => {
        asset.filePath = `${room.uuid}/${asset.file}`;
        remoteFiles.push(asset);
      });
    });

    return remoteFiles;
  }

  private async _loadLocalFiles(localFiles) {
    const mediaFiles = [];

    for (let i = 0; i < localFiles.length; i++) {
      const localFile = localFiles[i];
      const filePath = localFile.name;
      const pathParts = filePath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const mimeType = this.getFileMimeType(fileName);

      await localFile.async(UINT8ARRAY)
        .then((fileData) => {
          return new Blob([fileData], { type: mimeType });
        })
        .then((blob) => this.fileLoaderUtil.getBinaryFileData(blob))
        .then((binaryData) => {
          mediaFiles.push(new MediaFile({
            mimeType,
            fileName: fileName,
            remoteFile: null,
            binaryFileData: binaryData,
          }));
        });
    }

    return mediaFiles;
  }

  private _deserializeProject(story, mediaFiles, quick = true) {
    const homeRoom = story.rooms.find(room => room.uuid === story.homeRoomId) || story.rooms[0];
    const restRoomsMediaFiles = (quick ? this._extractRestRoomsMediaFiles(story, homeRoom) : {
      mediaFilesByRoom: [],
      mediaFiles: [],
    });

    const allMediaFiles = mediaFiles.concat(restRoomsMediaFiles.mediaFiles);

    this.roomManager.clearRooms();
    this.roomManager.setProjectName(story.name);
    this.roomManager.setProjectTags(story.tags || '');
    this.roomManager.setProjectDescription(story.description);

    if (story.homeRoomId) {
      this.roomManager.setHomeRoomId(story.homeRoomId);
    }

    if (story.soundtrack) {
      const soundtrack = allMediaFiles.find(mediaFile => mediaFile.getFileName() === story.soundtrack.file);

      if (soundtrack) {
        this.roomManager.setSoundtrackMediaFile(soundtrack, story.soundtrackVolume);
      } else {
        this.roomManager.removeSoundtrack();
      }
    } else {
      this.roomManager.removeSoundtrack();
    }

    this.deserializeRooms(story.rooms, homeRoom.uuid, allMediaFiles, quick)
      .forEach(room => this.roomManager.addRoom(room));

    return this._callbackLoadRestMediaFiles.bind(this, restRoomsMediaFiles.mediaFilesByRoom);
  }

  private async _callbackLoadRestMediaFiles(remoteMediaFilesByRoom) {
    for (let i = 0; i < remoteMediaFilesByRoom.length; i++) {
      const { roomId, roomMediaFiles } = remoteMediaFilesByRoom[i];
      const room: Room = this.roomManager.getRoomById(roomId);
      const filesCount = roomMediaFiles.length;
      let filesLoaded = 0;

      for (let j = 0; j < filesCount; j++) {
        const remoteFile: MediaFile = roomMediaFiles[j];

        await this.afStorage
          .ref(remoteFile.getRemoteFile())
          .getDownloadURL().toPromise()
          .then((fileStoreUrl) => this.apiService.loadBinaryData(fileStoreUrl).toPromise())
          .then((data: ArrayBuffer) => new Blob([data], { type: remoteFile.mimeType }))
          .then((blob) => this.fileLoaderUtil.getBinaryFileData(blob))
          .then((binaryData) => {
            remoteFile.setUploadedBinaryFileData(binaryData);
            filesLoaded += 1;
            room.setProgressLoading(100 * (filesLoaded / filesCount));
          })
          .catch((error) => {
            console.log('Error to load remote file:', remoteFile);
            console.log(error);
            filesLoaded += 1;
            room.setProgressLoading(100 * (filesLoaded / filesCount));
          });
      }

      room.setAssetsLoadedState(true);
    }
  }
}

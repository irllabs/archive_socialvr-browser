import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

import {RoomManager} from 'data/scene/roomManager';
import {PropertyBuilder} from 'data/scene/roomPropertyBuilder';
import {Room} from 'data/scene/entities/room';

import {ApiService} from 'data/api/apiService';
import {FileLoaderUtil} from 'ui/editor/util/fileLoaderUtil';

import 'rxjs/add/observable/fromPromise';
import 'isomorphic-fetch';

import {
  STORY_FILE_YAML, STORY_FILE_JSON, UINT8ARRAY,
  MIME_TYPE_MP3, MIME_TYPE_PNG, MIME_TYPE_UTF8,
  MIME_TYPE_JPG, MIME_TYPE_JPEG, MIME_TYPE_WAV, MIME_TYPE_AAC, MIME_TYPE_XM4A,
  BACKGROUND_THUMBNAIL
} from 'ui/common/constants';
import {Universal} from "../scene/entities/universal";
import {DEFAULT_FILE_NAME, DEFAULT_VOLUME} from "../../ui/common/constants";

const JSZip = require('jszip');
const JsYaml = require('js-yaml');

@Injectable()
export class DeserializationService {
  private zip = new JSZip();

  constructor(
    private roomManager: RoomManager,
    private propertyBuilder: PropertyBuilder,
    private fileLoaderUtil: FileLoaderUtil,
    private apiService: ApiService,
  ) {
  }

  private deserializeRooms(storyFile: any, binaryFileMap: any, baseFilePath: string): Promise<any> {
    return storyFile.async('string')
      .then(storyString => {
        let storyJson;

        if (storyFile.name.indexOf(STORY_FILE_JSON) >= 0) {
          storyJson = JSON.parse(storyString);
        } else {
          try {
            //remove room property descriptions from yaml file (ex: - !image, - !door)
            const bangDescriptionRegex = /!\w+\n/g;
            const newLineStoryYaml: string = storyString.replace(/\r\n/g, '\n');
            const cleanedStoryYaml: string = newLineStoryYaml.replace(bangDescriptionRegex, '\n');

            storyJson = JsYaml.load(cleanedStoryYaml);
          }
          catch (error) {
            console.error(error);
            return;
          }
        }

        this.roomManager.clearRooms();

        this.roomManager.setProjectName(storyJson.name);
        this.roomManager.setProjectTags(storyJson.tags || '');
        this.roomManager.setProjectDescription(storyJson.description);

        if (storyJson.homeRoomId) {
          this.roomManager.setHomeRoomId(storyJson.homeRoomId);
        }

        if (storyJson.soundtrack) {
          const soundtrack = binaryFileMap.find(mediaFile => mediaFile.name === storyJson.soundtrack);
          const soundtrackData = soundtrack ? soundtrack.fileData : null;

          this.roomManager.setSoundtrack(storyJson.soundtrack, storyJson.soundtrackVolume, soundtrackData);
        } else {
          this.roomManager.removeSoundtrack();
        }

        storyJson.rooms.map(roomData => {
          const filePrefix = roomData.uuid;

          // Background image
          let filename = roomData.image;

          if (roomData.image.hasOwnProperty('file')) {
            filename = roomData.image.file;
          }

          const roomImagePath = `${baseFilePath}${filePrefix}/${filename}`;
          const roomImage = binaryFileMap.find(mediaFile => mediaFile.name === roomImagePath);
          const roomImageData = roomImage ? roomImage.fileData : null;

          // Background thumbnail
          const roomThumbPath = `${baseFilePath}${filePrefix}/${BACKGROUND_THUMBNAIL}`;
          const roomThumbnail = binaryFileMap.find(mediaFile => mediaFile.name === roomThumbPath);
          const thumbnailImageData = roomThumbnail ? roomThumbnail.fileData : null;

          filename = roomData.ambient;
          if (roomData.ambient.hasOwnProperty('file')) {
            filename = roomData.ambient.file;
          }

          // Background audio
          const backgroundAudioPath = `${baseFilePath}${filePrefix}/${filename}`;
          const backgroundAudio = binaryFileMap.find(mediaFile => mediaFile.name === backgroundAudioPath);
          const backgroundAudioData = backgroundAudio ? backgroundAudio.fileData : null;

          filename = roomData.narrator.intro;
          if (roomData.narrator.intro.hasOwnProperty('file')) {
            filename = roomData.narrator.intro.file;
          }

          // Narrator intro audio
          const introAudioPath = roomData.narrator ? `${baseFilePath}${filePrefix}/${filename}` : '';
          const introAudio = binaryFileMap.find(mediaFile => mediaFile.name === introAudioPath);
          const introAudioData = introAudio ? introAudio.fileData : null;

          filename = roomData.narrator.reprise;
          if (roomData.narrator.reprise.hasOwnProperty('file')) {
            filename = roomData.narrator.reprise.file;
          }

          // Narrator return audio
          const returnAudioPath = roomData.narrator ? `${baseFilePath}${filePrefix}/${filename}` : '';
          const returnAudio = binaryFileMap.find(mediaFile => mediaFile.name === returnAudioPath);
          const returnAudioData = returnAudio ? returnAudio.fileData : null;

          const room: Room = this.propertyBuilder.roomFromJson(roomData, roomImageData, thumbnailImageData, backgroundAudioData);
          const doors = roomData.doors || [];
          const autoDoors = roomData.autoDoors || [];
          const allDoors = doors.concat(autoDoors);

          // necessary if yaml files use undefined vs empty array
          roomData.texts = roomData.texts || [];
          roomData.clips = roomData.clips || [];
          roomData.images = roomData.images || [];

          // Convert old project's hotspots to new Universal one
          this.convertToUniversal(
            room,
            baseFilePath,
            filePrefix,
            binaryFileMap,
            roomData.texts,
            roomData.clips,
            roomData.images
          );

          (roomData.universal || [])
            .map(universalJson => {
              const imageFileName: string = `${baseFilePath}${filePrefix}/${universalJson.imageFile}`;
              const imageBinaryFile = binaryFileMap.find(mediaFile => mediaFile.name === imageFileName);
              const imageBinaryFileData: string = imageBinaryFile ? imageBinaryFile.fileData : null;

              const audioFileName: string = `${baseFilePath}${filePrefix}/${universalJson.audioFile}`;
              const audioBinaryFile = binaryFileMap.find(mediaFile => mediaFile.name === audioFileName);
              const audioBinaryFileData: string = audioBinaryFile ? audioBinaryFile.fileData : null;

              return this.propertyBuilder.universalFromJson(universalJson, imageBinaryFileData, audioBinaryFileData);
            })
            .forEach(universal => room.addUniversal(universal));

          allDoors
            .map(doorJson => this.propertyBuilder.doorFromJson(doorJson))
            .forEach(door => room.addDoor(door));

          const narrator = this.propertyBuilder.narratorFromJson(roomData.narrator, introAudioData, returnAudioData);

          room.setNarrator(narrator);

          this.roomManager.addRoom(room);
        });
      });
  }

  convertToUniversal(room, baseFilePath, filePrefix, binaryFileMap, texts, clips, images){
    const universals = [];

    // Text to Universal
    texts.forEach((textJson) => {
      const universal: Universal = <Universal> this.propertyBuilder.setBaseProperties(textJson, new Universal());

      universal.textContent = textJson.file;
      universal.setAudioContent(DEFAULT_FILE_NAME, null, DEFAULT_VOLUME);
      universal.setImageContent(DEFAULT_FILE_NAME, null);

      universals.push(universal);
    });

    // Audio to Universal
    clips.forEach((audioJson) => {
      const universal: Universal = <Universal> this.propertyBuilder.setBaseProperties(audioJson, new Universal());
      const fileName: string = `${baseFilePath}${filePrefix}/${audioJson.file}`;
      const binaryFile = binaryFileMap.find(mediaFile => mediaFile.name === fileName);
      const binaryFileData: string = binaryFile ? binaryFile.fileData : null;
      const volume = audioJson.volume;
      let audioFileName = DEFAULT_FILE_NAME;

      if (audioJson.hasOwnProperty('file')) audioFileName = decodeURIComponent(audioJson.file);
      if (audioJson.hasOwnProperty('remoteFile')) {
        universal.audioContent.setRemoteFileName(audioJson.remoteFile);
      }

      universal.setAudioContent(audioFileName, binaryFileData, volume);
      universal.setImageContent(DEFAULT_FILE_NAME, null);

      universals.push(universal);
    });

    // Image to Universal
    images.forEach((imageJson) => {
      const universal: Universal = <Universal> this.propertyBuilder.setBaseProperties(imageJson, new Universal());
      const fileName: string = `${baseFilePath}${filePrefix}/${imageJson.file}`;
      const binaryFile = binaryFileMap.find(mediaFile => mediaFile.name === fileName);
      const binaryFileData: string = binaryFile ? binaryFile.fileData : null;
      let imageFileName = DEFAULT_FILE_NAME;

      if (imageJson.hasOwnProperty('file')) imageFileName = decodeURIComponent(imageJson.file);
      if (imageJson.hasOwnProperty('remoteFile')) {
        universal.audioContent.setRemoteFileName(imageJson.remoteFile);
      }

      universal.setImageContent(imageFileName, binaryFileData);
      universal.setImageContent(DEFAULT_FILE_NAME, null);

      universals.push(universal);
    });

    universals.forEach(universal => room.addUniversal(universal));
  }

  unzipStoryFile(file: any): Observable<any> {
    return Observable.fromPromise(
      this.zip.loadAsync(file).then(file => this.deserializeProject(file))
    );
    // .catch(error => console.log('error', mediaFile.name, error));
  }

  // Given a jszip file containing an image or audio
  // return a promise containing the name of the file
  // and binary data
  private loadMediaFile(mediaFile: any, getBinaryFileData: any): Promise<any> {
    return mediaFile.async(UINT8ARRAY)
      .then(fileData => {
        const fileType = this.getFileType(mediaFile.name);
        return new Blob([fileData], {type: fileType});
      })
      .then(blob => {
        return getBinaryFileData(blob);
      })
      .then(binaryDataFile => {
        return {
          name: mediaFile.name,
          fileData: binaryDataFile
        };
      });
  }

  private loadRemoteMediaFile(mediaFile: any, getBinaryFileData: any): Promise<any> {
    let remoteFileUrl = mediaFile.remoteFile;

    if (mediaFile.remoteFile.indexOf('socialvr-staging.s3.amazonaws.com') > 0) {
      remoteFileUrl = `${mediaFile.remoteFile.replace('socialvr-staging.s3.amazonaws.com', 'socialvr-staging.imgix.net')}?q=60`;
    }

    return this.apiService.downloadMedia(remoteFileUrl).toPromise()
      .then(fileData => {
        const fileType = this.getFileType(mediaFile.file);

        return new Blob([fileData], {type: fileType});
      })
      .then(blob => {
        return getBinaryFileData(blob);
      })
      .then(binaryDataFile => {
        return {
          name: mediaFile.filePath,
          fileData: binaryDataFile,
          remoteFile: remoteFileUrl,
        };
      })
      .catch(error => console.log('error', mediaFile.file, error));
  }

  // Given a json object of jszip files, return a list of
  // promises containing image and audio binary data
  private async loadMediaFiles(fileMap: any, storyFilePath: string, getBinaryFileData: any) {
    const files = Object.keys(fileMap)
      .filter(fileKey => fileKey.indexOf(STORY_FILE_YAML) < 0)
      .filter(fileKey => fileKey.indexOf(STORY_FILE_JSON) < 0)
      .map(fileKey => fileMap[fileKey])
      .filter(file => !file.dir);

    const remoteFiles = [];
    let getRemoteFiles = Promise.resolve(remoteFiles);

    // Only check for remote files if storyFile is JSON
    if (storyFilePath.indexOf(STORY_FILE_JSON) >= 0) {
      getRemoteFiles = fileMap[storyFilePath].async('string')
        .then(storyString => {
          const storyJson = JSON.parse(storyString);

          storyJson.rooms.map((room) => {
            const universalMediaFiles = (room.universal || []).reduce((acc, universal) => {
              return acc.concat([
                {
                  file: universal.imageFile,
                  remoteFile: universal.remoteImageFile
                },
                {
                  file: universal.audioFile,
                  remoteFile: universal.remoteAudioFile
                },
              ]);
            }, []);
            const assets = [
              ...room.clips,
              ...room.images,
              ...universalMediaFiles,
              room.ambient,
              room.image,
              room.thumbnail || {}, // new key that is not present in older story files
              room.narrator.intro,
              room.narrator.reprise,
            ];

            assets.map((asset) => {
              if (asset.hasOwnProperty('remoteFile') && asset.remoteFile) {
                // Add to remoteFiles if not present locally
                asset.filePath = `${room.uuid}/${asset.file}`;

                if (files.map(file => file.name).indexOf(asset.filePath) < 0) {
                  remoteFiles.push(asset);
                }
              }
            });
          });

          return remoteFiles;
        });
    }

    const mediaFiles = [];

    await getRemoteFiles.then(async (remoteFiles: any) => {
      for (let i = 0; i < remoteFiles.length; i++) {
        const file = remoteFiles[i];
        await this.loadRemoteMediaFile(file, getBinaryFileData).then(mediaFile => mediaFiles.push(mediaFile));
      }
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await this.loadMediaFile(file, getBinaryFileData).then(mediaFile => mediaFiles.push(mediaFile));
    }

    return mediaFiles;
  }

  // Given a JSON object representing story file,
  // return a promise that resolves when the story file is deserialized
  private deserializeProject(jsZipData) {
    const fileMap = jsZipData.files;

    let storyFilePath: string = Object.keys(fileMap)
      .filter(fileKey => fileKey.indexOf(STORY_FILE_YAML) > -1)[0] || STORY_FILE_YAML;
    let baseFilePath: string = storyFilePath.substring(0, storyFilePath.indexOf(STORY_FILE_YAML));

    // If a story.json file is present, assume assets have been uploaded to S3
    if (Object.keys(fileMap).indexOf(STORY_FILE_JSON) > -1) {
      baseFilePath = storyFilePath.substring(0, storyFilePath.indexOf(STORY_FILE_JSON));
      storyFilePath = `${baseFilePath}${STORY_FILE_JSON}`
    }

    const storyFile = fileMap[storyFilePath];
    const getBinaryFileData = this.fileLoaderUtil.getBinaryFileData.bind(this.fileLoaderUtil);
    const mediaFilePromises = this.loadMediaFiles(fileMap, storyFilePath, getBinaryFileData);

    return mediaFilePromises.then(binaryFileMap => this.deserializeRooms(storyFile, binaryFileMap, baseFilePath));
  }

  private getFileType(fileName) {
    const fileType = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
    const fileMap = {
      '.mp3': MIME_TYPE_MP3,
      '.wav': MIME_TYPE_WAV,
      '.aac': MIME_TYPE_AAC,
      '.m4a': MIME_TYPE_XM4A,
      '.png': MIME_TYPE_PNG,
      '.jpg': MIME_TYPE_JPG,
      '.jpeg': MIME_TYPE_JPEG
    };
    return fileMap[fileType] || MIME_TYPE_PNG;
  }
}

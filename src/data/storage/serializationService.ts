import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { AssetInteractor } from 'core/asset/assetInteractor';
import { MediaFile } from 'data/scene/entities/mediaFile';
import { RoomManager } from 'data/scene/roomManager';
import { resizeImage } from 'data/util/imageResizeService';

import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Observable';

import {
  BACKGROUND_THUMBNAIL,
  DEFAULT_FILE_NAME,
  MIME_TYPE_UTF8,
  STORY_FILE_JSON,
  STORY_FILE_YAML,
} from 'ui/common/constants';

const JSZip = require('jszip');
const JsYaml = require('js-yaml');

@Injectable()
export class SerializationService {

  constructor(
    private roomManager: RoomManager,
    private http: Http,
    private assetInteractor: AssetInteractor,
  ) {
  }

  private buildProjectJson() {
    const roomList = Array.from(this.roomManager.getRooms()).map(room => room.toJson());

    return {
      name: this.roomManager.getProjectName(),
      tags: this.roomManager.getProjectTags(),
      soundtrack: this.roomManager.getSoundtrack().toJson(),
      soundtrackVolume: this.roomManager.getSoundtrackVolume(),
      description: this.roomManager.getProjectDescription(),
      homeRoomId: this.roomManager.getHomeRoomId(),
      rooms: roomList,
    };
  }

  private buildAssetDirectories(zip) {
    Array.from(this.roomManager.getRooms())
      .forEach(room => {
        const directoryName: string = room.getId();
        const roomHasImage: boolean = room.getFileName() !== DEFAULT_FILE_NAME;

        const imageList = Array.from(room.getImages())
          .filter(image => image.getBinaryFileData())
          .map(image => {
              return {
                name: encodeURIComponent(image.getFileName()),
                binaryData: getBase64FromDataUrl(image.getBinaryFileData()),
              };
            },
          );

        const audioList = Array.from(room.getAudio())
          .filter(audio => audio.getBinaryFileData())
          .map(audio => {
              return {
                name: encodeURIComponent(audio.getFileName()),
                binaryData: getBase64FromDataUrl(audio.getBinaryFileData()),
              };
            },
          );

        Array.from(room.getUniversal()).forEach((universal) => {
          // has Image
          const image = universal.imageContent;

          if (image.hasAsset()) {
            imageList.push({
              name: encodeURIComponent(image.getFileName()),
              binaryData: getBase64FromDataUrl(image.getBinaryFileData()),
            });
          }

          // has Audio
          const audio = universal.audioContent;

          if (audio.hasAsset()) {
            audioList.push({
              name: encodeURIComponent(audio.getFileName()),
              binaryData: getBase64FromDataUrl(audio.getBinaryFileData()),
            });
          }
        });

        [...imageList, ...audioList].forEach(file => {
          zip.folder(directoryName).file(file.name, file.binaryData, { base64: true });
        });

        // Narrator intro audio
        const introAudio = room.getNarrator().getIntroAudio();
        const returnAudio = room.getNarrator().getReturnAudio();

        if (introAudio.hasAsset()) {
          const fileName = encodeURIComponent(introAudio.getFileName());
          const dataUrlString = getBase64FromDataUrl(introAudio.getBinaryFileData());

          zip.folder(directoryName).file(fileName, dataUrlString, { base64: true });
        }

        if (returnAudio.hasAsset()) {
          const fileName = encodeURIComponent(returnAudio.getFileName());
          const dataUrlString = getBase64FromDataUrl(returnAudio.getBinaryFileData());

          zip.folder(directoryName).file(fileName, dataUrlString, { base64: true });
        }

        // Room background image
        if (roomHasImage) {
          const roomImageName: string = encodeURIComponent(room.getFileName());
          const roomBinaryImageData: string = getBase64FromDataUrl(room.getBinaryFileData());

          zip.folder(directoryName).file(roomImageName, roomBinaryImageData, { base64: true });
        }

        // Room background thumbnail
        if (room.getThumbnailImage()) {
          const thumbnailImageData: string = getBase64FromDataUrl(room.getThumbnailImage());

          zip.folder(directoryName).file(BACKGROUND_THUMBNAIL, thumbnailImageData, { base64: true });
        }

        // Room background audio
        if (room.getBackgroundAudio().hasAsset()) {
          const fileName: string = encodeURIComponent(room.getBackgroundAudio().getFileName());
          const audioData: string = getBase64FromDataUrl(room.getBackgroundAudio().getBinaryFileData());

          zip.folder(directoryName).file(fileName, audioData, { base64: true });
        }
      });
    return new Promise((resolve, reject) => resolve(zip));
  }

  private buildJsonStoryFile(projectJson) {
    const projectSerialized = JSON.stringify(projectJson);

    return new Blob([projectSerialized], { type: MIME_TYPE_UTF8 });
  }

  private buildYamlStoryFile(projectJson) {
    const projectSerialized = JsYaml.dump(projectJson);

    return new Blob([projectSerialized], { type: MIME_TYPE_UTF8 });
  }

  private getHomeRoomImage(): Promise<string> {
    const homeRoomId = this.roomManager.getHomeRoomId();
    const homeRoom = this.roomManager.getRoomById(homeRoomId);

    if (homeRoom.getThumbnailImage()) {
      return Promise.resolve(getBase64FromDataUrl(homeRoom.getThumbnailImage()));
    }

    const binaryFile: string = this.roomManager.getRoomById(homeRoomId).getBinaryFileData();

    return resizeImage(binaryFile, 'projectThumbnail')
      .then(resizedImage => getBase64FromDataUrl(resizedImage));
  }

  private getProjectSoundtrack(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.roomManager.getSoundtrack().hasAsset()) {
        console.log('this.roomManager.getSoundtrack() ', this.roomManager.getSoundtrack());
        resolve(this.roomManager.getSoundtrack());
      } else {
        reject('no Soundtrack');
      }
    });
  }

  private buildProjectZip() {
    const zip = new JSZip();

    // Promises to be completed before ZIP file is created
    const promises = [
      // Prepare assets, then build story files
      this.buildAssetDirectories(zip)
        .then(built => {
          const projectJson = this.buildProjectJson();

          zip.file(STORY_FILE_JSON, this.buildJsonStoryFile(projectJson));
          zip.file(STORY_FILE_YAML, this.buildYamlStoryFile(projectJson));
        }),

      // Add homeroom image to ZIP
      this.getHomeRoomImage().then(homeRoomImage => zip.file('thumbnail.jpg', homeRoomImage, { base64: true })),

      // Add project soundtrack to ZIP
      this.getProjectSoundtrack()
        .then((soundtrack) => {
          return zip.file(
            soundtrack.getFileName(),
            getBase64FromDataUrl(soundtrack.getBinaryFileData()), { base64: true },
          );
        })
        .catch(error => console.log(error)),
    ];

    // Build ZIP
    const zipBuilder = Promise.all(promises).then(() => zip.generateAsync({ type: 'blob' }));

    return Observable.fromPromise(zipBuilder);
  }

  zipStoryFile(): Observable<any> {
    return this.buildProjectZip();
  }
}

function getBase64FromDataUrl(safeDataUrl): string {
  // strip the base64 data from the 'safe url' angular object
  // while this may appear to be a bad idea, it seems to be the only
  // way to save media assets in the story zip file
  const dataUrlString: string = safeDataUrl.changingThisBreaksApplicationSecurity ?
    safeDataUrl.changingThisBreaksApplicationSecurity : safeDataUrl;
  return dataUrlString.substring(dataUrlString.indexOf(',') + 1);
}

function getBlobFromDataUrl(safeDataUrl): Blob {
  let blob;

  try {
    // From https://stackoverflow.com/a/12300351
    // convert base64 to raw binary data held in a string

    const dataUrlString = safeDataUrl.changingThisBreaksApplicationSecurity ?
      safeDataUrl.changingThisBreaksApplicationSecurity : safeDataUrl;

    const byteString = atob(dataUrlString.split(',')[1]);
    // separate out the mime component
    const mimeString = dataUrlString.split(',')[0].split(':')[1].split(';')[0];
    // write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length);
    // create a view into the buffer
    const ia = new Uint8Array(ab);
    // set the bytes of the buffer to the correct values
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    // write the ArrayBuffer to a blob, and you're done
    blob = new Blob([ab], { type: mimeString });
  } catch (err) {
    console.error(err);
  }

  return blob;
}

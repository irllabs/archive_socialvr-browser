import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

import {
  DEFAULT_FILE_NAME,
  MIME_TYPE_UTF8,
  STORY_FILE_YAML,
  STORY_FILE_JSON,
  BACKGROUND_THUMBNAIL
} from 'ui/common/constants';

import {AssetInteractor} from 'core/asset/assetInteractor';
import {RoomManager} from 'data/scene/roomManager';
import {MediaFile} from 'data/scene/entities/mediaFile';
import {Room} from 'data/scene/entities/room';
import {Http, Response, Headers, RequestOptions, ResponseContentType} from '@angular/http';
import {Image} from 'data/scene/entities/image';
import {resizeImage} from 'data/util/imageResizeService';

import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/toPromise';

const JSZip = require('jszip');
const JsYaml = require('js-yaml');

@Injectable()
export class SerializationService {

  constructor(
    private roomManager: RoomManager,
    private http: Http,
    private assetInteractor: AssetInteractor,
  ) {}

  private buildProjectJson() {
    const roomList = Array.from(this.roomManager.getRooms())
      .map(room => room.toJson());
    return {
      name: this.roomManager.getProjectName(),
      tags: this.roomManager.getProjectTags(),
      soundtrack: this.roomManager.getSoundtrack().toJson(),
      soundtrackVolume: this.roomManager.getSoundtrackVolume(),
      description: this.roomManager.getProjectDescription(),
      homeRoomId: this.roomManager.getHomeRoomId(),
      rooms: roomList
    };
  }

  private uploadAssets() {
    // Collect individual room assets
    let mediaFiles = [];
    let mediaFileUploads = [];
    Array.from(this.roomManager.getRooms())
      .forEach(room => {
        const directoryName: string = room.getId();

        const imageList = Array.from(room.getImages()).map(image => image.getMediaFile())
        const audioList = Array.from(room.getAudio()).map(audio => audio.getMediaFile())
        mediaFiles = [...mediaFiles, ...imageList, ...audioList];

        // Narrator intro audio
        const introAudio = room.getNarrator().getIntroAudio();
        const returnAudio = room.getNarrator().getReturnAudio();
        if (introAudio.getMediaFile().hasAsset()) {
          mediaFiles.push(introAudio.getMediaFile());
        }
        if (returnAudio.getMediaFile().hasAsset()) {
          mediaFiles.push(returnAudio.getMediaFile());
        }

        // Room background audio
        if (room.getBackgroundAudio().getMediaFile().hasAsset()) {
          mediaFiles.push(room.getBackgroundAudio().getMediaFile())
        }

        // Room background image
        if (room.hasBackgroundImage()) {
          mediaFiles.push(room.getBackgroundImage().getMediaFile());
        }

        // Room background thumbnail
        if (room.getThumbnailImage()) {
          mediaFiles.push(room.getThumbnail().getMediaFile());
        }

        mediaFileUploads = Object.assign(mediaFiles
          .filter(mediaFile => !mediaFile.isUploaded())
          .map(mediaFile => {
            const key = `${directoryName}/${mediaFile.getFileName()}`;
	    const file = getBlobFromDataUrl(mediaFile.getBinaryFileData());
            return this.assetInteractor.uploadMedia(key, file)
              .flatMap((response) => {
                console.log(`Uploaded ${response}`);
                mediaFile.setRemoteFileName(response);
                return key;
              });
          }),
        mediaFileUploads);
      });
    return Promise.all(mediaFileUploads.map(obs => obs.toPromise(obs))); 
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
              binaryData: getBase64FromDataUrl(image.getBinaryFileData())
            };
          }
        );

        const audioList = Array.from(room.getAudio())
          .filter(audio => audio.getBinaryFileData())
          .map(audio => {
            return {
              name: encodeURIComponent(audio.getFileName()),
              binaryData: getBase64FromDataUrl(audio.getBinaryFileData())
            };
          }
        );

        [...imageList, ...audioList].forEach(file => {
          zip.folder(directoryName).file(file.name, file.binaryData, {base64: true});
        });

        // Narrator intro audio
        const introAudio = room.getNarrator().getIntroAudio();
        const returnAudio = room.getNarrator().getReturnAudio();
        if (introAudio.hasAsset()) {
          const fileName = encodeURIComponent(introAudio.getFileName());
          const dataUrlString = getBase64FromDataUrl(introAudio.getBinaryFileData());
          zip.folder(directoryName).file(fileName, dataUrlString, {base64: true});
        }
        if (returnAudio.hasAsset()) {
          const fileName = encodeURIComponent(returnAudio.getFileName());
          const dataUrlString = getBase64FromDataUrl(returnAudio.getBinaryFileData());
          zip.folder(directoryName).file(fileName, dataUrlString, {base64: true});
        }

        // Room background image
        if (roomHasImage) {
          const roomImageName: string = encodeURIComponent(room.getFileName());
          const roomBinaryImageData: string = getBase64FromDataUrl(room.getBinaryFileData());
          zip.folder(directoryName).file(roomImageName, roomBinaryImageData, {base64: true});
        }
        // Room background thumbnail
        if (room.getThumbnailImage()) {
          const roomImageName: string = encodeURIComponent(room.getFileName());
          const thumbnailImageData: string = getBase64FromDataUrl(room.getThumbnailImage());
          zip.folder(directoryName).file(BACKGROUND_THUMBNAIL, thumbnailImageData, {base64: true});
        }
        // Room background audio
        if (room.getBackgroundAudio().hasAsset()) {
          const fileName: string = encodeURIComponent(room.getBackgroundAudio().getFileName());
          const audioData: string = getBase64FromDataUrl(room.getBackgroundAudio().getBinaryFileData());
          zip.folder(directoryName).file(fileName, audioData, {base64: true});
        }
      });
    return zip;
  }

  private buildZipStoryFile(bundleAssets = false) {
    const projectJson = JSON.stringify(this.buildProjectJson());
    const projectYaml = JsYaml.dump(projectJson);

    const projectFileBlobYaml = new Blob([projectYaml], {type: MIME_TYPE_UTF8});
    const projectFileBlobJson = new Blob([projectJson], {type: MIME_TYPE_UTF8});

    let zip = new JSZip();
    if (bundleAssets) {
      zip = this.buildAssetDirectories(zip);
    }
    zip.file(STORY_FILE_YAML, projectFileBlobYaml);
    zip.file(STORY_FILE_JSON, projectFileBlobJson);
    return zip;
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
        resolve(this.roomManager.getSoundtrack())
      } else {
        reject('no Soundtrack');
      }
    });
  }

  private buildProjectZip(bundleAssets = false) {
    const zip = this.buildZipStoryFile(bundleAssets);
    const zipBuilder = Promise.all([
      this.getHomeRoomImage()
      .then(homeRoomImage => zip.file('thumbnail.jpg', homeRoomImage, {base64: true})),
      this.getProjectSoundtrack()
      .then(Soundtrack => zip.file(Soundtrack.getFileName(), getBase64FromDataUrl(Soundtrack.getBinaryFileData()), {base64: true}))
      .catch(error => console.log(error))
    ]).then(resolve => zip.generateAsync({type: 'blob'}));
    return Observable.fromPromise(zipBuilder);
  }

  zipStoryFile(bundleAssets = false): Observable<any> {
    if (bundleAssets) { return this.buildProjectZip(bundleAssets) };
    return Observable.fromPromise(this.uploadAssets()
      .then(() => this.buildProjectZip(bundleAssets))
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

    var byteString = atob(dataUrlString.split(',')[1]);
    // separate out the mime component
    var mimeString = dataUrlString.split(',')[0].split(':')[1].split(';')[0]
    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    // create a view into the buffer
    var ia = new Uint8Array(ab);
    // set the bytes of the buffer to the correct values
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    // write the ArrayBuffer to a blob, and you're done
    blob = new Blob([ab], {type: mimeString});
  }
  catch (err) {
    console.error(err);
  }
  finally {
    return blob;
  }
}

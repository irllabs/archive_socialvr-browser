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
import 'rxjs/add/operator/toPromise';

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
    const uploads = {}
    Array.from(this.roomManager.getRooms())
      .forEach(room => {
        const directoryName: string = room.getId();

        const imageList = Array.from(room.getImages()).map(image => image)
        const audioList = Array.from(room.getAudio()).map(audio => audio)
        let mediaFiles = [...imageList, ...audioList];

        // Narrator intro audio
        const introAudio = room.getNarrator().getIntroAudio();
        const returnAudio = room.getNarrator().getReturnAudio();
        if (introAudio.hasAsset()) {
          mediaFiles.push(introAudio);
        }
        if (returnAudio.hasAsset()) {
          mediaFiles.push(returnAudio);
        }

        // Room background audio
        if (room.getBackgroundAudio().hasAsset()) {
          mediaFiles.push(room.getBackgroundAudio())
        }

        // Room background image
        if (room.hasBackgroundImage()) {
          mediaFiles.push(room.getBackgroundImage());
        }

        // Room background thumbnail
        if (room.getThumbnail().getMediaFile().hasAsset()) {
          mediaFiles.push(room.getThumbnail());
        }
        mediaFiles
          // TODO: Instead of checking type of entity here, use new hotspot type
          // to always have one method for fetching assets
          .map(f => f.getMediaFile ? f.getMediaFile() : f)
          .filter(mediaFile => !mediaFile.isUploaded())
          .map(mediaFile => {
            const key = `${directoryName}/${mediaFile.getFileName()}`;
            const file = getBlobFromDataUrl(mediaFile.getBinaryFileData());
            const uploadPromise = this.assetInteractor.uploadMedia(key, file).toPromise()
              .then((response) => {
                console.log(`Uploaded ${key} ${response}`);
                mediaFile.setRemoteFileName(response);
              });
            uploads[key] = uploadPromise;
          })
        });
    console.log("All Uploads", uploads);
    return Promise.all(Object.values(uploads));
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
    return new Promise((resolve, reject) => resolve(zip));
  }

  private buildJsonStoryFile() {
      const projectJson = JSON.stringify(this.buildProjectJson());
      const projectFileBlobJson = new Blob([projectJson], {type: MIME_TYPE_UTF8});
      return projectFileBlobJson
  }

  private buildYamlStoryFile(zip) {
    const projectYaml = JsYaml.dump(projectYaml);
    const projectFileBlobYaml = new Blob([projectYaml], {type: MIME_TYPE_UTF8});
    return projectFileBlobYaml;
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
    const zip = new JSZip();
    let assetPromise;
    // If bundleassets, add all files to ZIP. Otherwise upload to S3.
    if (bundleAssets) {
      assetPromise = this.buildAssetDirectories(zip);
    } else {
      assetPromise = this.uploadAssets();
    }
    // Promises to be completed before ZIP file is created
    const promises = [
      // Prepare assets, then build story files
      assetPromise
        .then(built => {
          zip.file(STORY_FILE_JSON, this.buildJsonStoryFile());
          zip.file(STORY_FILE_YAML, this.buildYamlStoryFile());
        }),
      // Add homeroom image to ZIP
      this.getHomeRoomImage()
        .then(homeRoomImage => zip.file('thumbnail.jpg', homeRoomImage, {base64: true})),
      // Add project soundtrack to ZIP
      this.getProjectSoundtrack()
        .then(Soundtrack => zip.file(Soundtrack.getFileName(), getBase64FromDataUrl(Soundtrack.getBinaryFileData()), {base64: true}))
        .catch(error => console.log(error)),
    ]
    // Build ZIP
    const zipBuilder = Promise.all(promises).then(resolve => zip.generateAsync({type: 'blob'}));
    return Observable.fromPromise(zipBuilder);
  }

  zipStoryFile(bundleAssets = false): Observable<any> {
    return this.buildProjectZip(bundleAssets)
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

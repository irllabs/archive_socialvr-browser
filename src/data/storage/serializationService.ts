import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

import {
  DEFAULT_FILE_NAME,
  MIME_TYPE_UTF8, STORY_FILE,
  BACKGROUND_THUMBNAIL
} from 'ui/common/constants';

import {RoomManager} from 'data/scene/roomManager';
import {Room} from 'data/scene/entities/room';
import {Image} from 'data/scene/entities/image';
import {resizeImage} from 'data/util/imageResizeService';

const JSZip = require('jszip');
const JsYaml = require('js-yaml');

@Injectable()
export class SerializationService {

  constructor(private roomManager: RoomManager) {}

  private buildProjectJson() {
    const roomList = Array.from(this.roomManager.getRooms())
      .map(room => room.toJson());
    return {
      name: this.roomManager.getProjectName(),
      tags: this.roomManager.getProjectTags(),
      soundtrack: this.roomManager.getSoundtrack().getFileName(),
      soundtrackVolume: this.roomManager.getSoundtrackVolume(),
      description: this.roomManager.getProjectDescription(),
      homeRoomId: this.roomManager.getHomeRoomId(),
      rooms: roomList
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

  private buildZipStoryFile() {
    const projectJson = this.buildProjectJson();
    const projectYaml = JsYaml.dump(projectJson);
    const projectFileBlob = new Blob([projectYaml], {type: MIME_TYPE_UTF8});
    const zip = this.buildAssetDirectories(new JSZip());
    zip.file(STORY_FILE, projectFileBlob);
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

  zipStoryFile(): Observable<any> {
    const zip = this.buildZipStoryFile();
    const zipBuilder = Promise.all([
      this.getHomeRoomImage()
      .then(homeRoomImage => zip.file('thumbnail.jpg', homeRoomImage, {base64: true})),
      this.getProjectSoundtrack()
      .then(Soundtrack => zip.file(Soundtrack.getFileName(), getBase64FromDataUrl(Soundtrack.getBinaryFileData()), {base64: true}))
      .catch(error => console.log(error))
    ])
    .then(resolve => zip.generateAsync({type: 'blob'}));
    return Observable.fromPromise(zipBuilder);
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

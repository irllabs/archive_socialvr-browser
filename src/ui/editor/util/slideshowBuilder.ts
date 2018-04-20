import {Injectable} from '@angular/core';

import {FileLoaderUtil, mimeTypeMap} from 'ui/editor/util/fileLoaderUtil';
import {PropertyBuilder} from 'data/scene/roomPropertyBuilder';
import {resizeImage} from 'data/util/imageResizeService';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {Door} from 'data/scene/entities/door';


@Injectable()
export class SlideshowBuilder {

  constructor(
    private sceneInteractor: SceneInteractor,
    private fileLoaderUtil: FileLoaderUtil,
    private propertyBuilder: PropertyBuilder
  ) {}

  build(files): Promise<any> {
    const fileList = Object.keys(files)
      .map(key => files[key])
      .sort((a, b) => a.lastModified - b.lastModified);

    return this.processBackgroundFileList(fileList);
  }

  private processBackgroundFileList(fileList): Promise<any> {
    const backgroundFiles = fileList
      .filter(file => mimeTypeMap['image'].indexOf(file.type) > -1)
      .map(file => this.fileLoaderUtil.getBinaryFileData(file).then(dataUrl => resizeImage(dataUrl, 'backgroundImage')));

    return Promise.all(backgroundFiles)
      .then(resizedList => resizedList.map((resized: any, index) => {
        let roomId = this.sceneInteractor.getActiveRoomId();
        let room = this.sceneInteractor.getRoomById(roomId);
        if (room.hasBackgroundImage()) {
          roomId = this.sceneInteractor.addRoom();
          room = this.sceneInteractor.getRoomById(roomId);
        }
        const fileName = fileList[index].name;
        room.setFileData(fileName, resized.backgroundImage);
        room.setThumbnail(fileName, resized.thumbnail);
        return room;
        })
      )
      .then(roomList => roomList.forEach((room, index) => {

      }));
  }

}

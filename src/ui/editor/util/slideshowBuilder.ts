import { Injectable } from '@angular/core';
import { SceneInteractor } from 'core/scene/sceneInteractor';
import { resizeImage } from 'data/util/imageResizeService';

import { FileLoaderUtil, mimeTypeMap } from 'ui/editor/util/fileLoaderUtil';


@Injectable()
export class SlideshowBuilder {

  constructor(
    private sceneInteractor: SceneInteractor,
    private fileLoaderUtil: FileLoaderUtil,
  ) {
  }

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
      .then(resizedList => resizedList.map((resized: any) => {
          let roomId = this.sceneInteractor.getActiveRoomId();
          let room = this.sceneInteractor.getRoomById(roomId);

          if (room.hasBackgroundImage()) {
            roomId = this.sceneInteractor.addRoom();
            room = this.sceneInteractor.getRoomById(roomId);
          }

          room.setBackgroundImageBinaryData(resized.backgroundImage);
          room.setThumbnail(resized.thumbnail);
          return room;
        }),
      );
  }

}

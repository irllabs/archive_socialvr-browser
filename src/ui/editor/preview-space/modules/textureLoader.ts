import {Injectable} from '@angular/core';

import {SceneInteractor} from 'core/scene/sceneInteractor';
import {AssetInteractor, AssetModel} from 'core/asset/assetInteractor';
import {ICON_PATH, IMAGE_PATH} from 'ui/common/constants';

const iconPaths: AssetModel[] = [
  new AssetModel('door',  'door',  `${ICON_PATH}door_filled.png`),
  new AssetModel('image', 'image', `${ICON_PATH}image_filled.png`),
  new AssetModel('text',  'text',  `${ICON_PATH}text_filled.png`),
  new AssetModel('audio', 'audio', `${ICON_PATH}audio_filled.png`),
  new AssetModel('link', 'link', `${ICON_PATH}link_filled.png`),
  new AssetModel('back', 'back', `${ICON_PATH}back_filled.png`),
  new AssetModel('home', 'home', `${ICON_PATH}home_filled.png`),
  new AssetModel('colorBall', 'colorBall', `${IMAGE_PATH}color_ball.jpg`),
  new AssetModel('imageMask', 'imageMask', `${IMAGE_PATH}image-mask_1920.jpg`)
];

@Injectable()
export class TextureLoader {

  constructor(
    private sceneInteractor: SceneInteractor,
    private assetInteractor: AssetInteractor
  ) {}

  load(): Promise<any> {
    const backgroundImages = this.sceneInteractor.getRoomIds()
      .map(roomId => {
        const room = this.sceneInteractor.getRoomById(roomId);
        console.log('room', room);
        return room;
      })
      .filter(room => room.hasBackgroundImage())
      .map(room => {
        console.log('--------backgroundImage', room);
        let imagePath = room.getBinaryFileData();
        if (imagePath.changingThisBreaksApplicationSecurity) {
          imagePath = imagePath.changingThisBreaksApplicationSecurity;
        }
        return new AssetModel(room.getId(), room.getFileName(), imagePath);
      });

    //TODO: should this be in the interactor? There is an identical pattern with audio
    const hotspotImages = this.sceneInteractor.getRoomIds()
      .map(roomId => this.sceneInteractor.getRoomById(roomId))
      .reduce((accumulator, room) => {
        const imagePropertyList = Array.from(room.getImages())
          .filter(image => image.getBinaryFileData())
          .map(image => {
            const imageDataUri = image.getBinaryFileData().changingThisBreaksApplicationSecurity ?
              image.getBinaryFileData().changingThisBreaksApplicationSecurity : image.getBinaryFileData();
            return new AssetModel(image.getId(), image.getFileName(), imageDataUri);
          });
        return accumulator.concat(imagePropertyList);
      }, []);

    const imageList = backgroundImages
      .concat(hotspotImages)
      .concat(iconPaths);

    console.log('imageList', imageList);
    return this.assetInteractor.loadTextures(imageList);
  }

}

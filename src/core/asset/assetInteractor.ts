import {Injectable} from '@angular/core';
import {Texture} from 'three';

import {AssetManager} from 'data/asset/assetManager';

@Injectable()
export class AssetInteractor {

  constructor(private assetManager: AssetManager) {}

  loadTextures(imageDataList: AssetModel[]): Promise<any> {
    return this.assetManager.loadTextures(imageDataList);
  }

  loadAudioBuffers(audioDataList: AssetModel[]): Promise<any> {
    return this.assetManager.loadAudioBuffers(audioDataList);
  }

  getTextureById(id: string): Texture {
    return this.assetManager.getTextureById(id);
  }

  getAudioBufferById(id: string): AudioBuffer {
    return this.assetManager.getAudioBufferById(id);
  }

}

export class AssetModel {
  id: string;
  fileName: string;
  filePath: string;
  constructor(id: string, fileName: string, filePath: string) {
    this.id = id;
    this.fileName = fileName;
    this.filePath = filePath;
  }
}

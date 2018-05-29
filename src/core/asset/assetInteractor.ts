import { Injectable } from '@angular/core';

import { ApiService } from 'data/api/apiService';
import { AssetManager } from 'data/asset/assetManager';
import { Texture } from 'three';

@Injectable()
export class AssetInteractor {
  constructor(
    private apiService: ApiService,
    private assetManager: AssetManager,
  ) {
  }

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
  public id: string;
  public fileName: string;
  public filePath: string;
  public force: boolean; // if force is true this asset will be reloaded by textureLoader

  constructor(id: string, fileName: string, filePath: string) {
    this.id = id;
    this.fileName = fileName;
    this.filePath = filePath;
  }
}

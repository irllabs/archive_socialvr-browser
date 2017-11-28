import {Injectable} from '@angular/core';
import {Texture} from 'three';

import {ApiService} from 'data/api/apiService';
import {AssetService} from 'data/asset/assetService';
import {AssetManager} from 'data/asset/assetManager';

@Injectable()
export class AssetInteractor {

  constructor(
    private apiService: ApiService,
    private assetManager: AssetManager,
    private mediaService: AssetService,
  ) {}

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

  setUploadPolicy() {
    return this.apiService.getUploadPolicy()
      .do(response => {
        this.mediaService.setUploadPolicy(response);
      });
  }

  getUploadPolicy() {
    let uploadPolicy = this.mediaService.getUploadPolicy();
    if (!uploadPolicy) {
      return this.setUploadPolicy()
        .subscribe(
          uploadPolicy => uploadPolicy,
          error => console.error(error)
        )
    }
    return uploadPolicy;
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

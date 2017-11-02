import {Injectable} from '@angular/core';

import {Texture} from 'three';
import {AssetModel} from 'core/asset/assetInteractor';
import {getAudioContext} from 'ui/editor/util/audioContextProvider';

@Injectable()
export class AssetManager {

    private textureMap: Map<string, TextureData> = new Map();
    private audioBufferMap: Map<string, AudioData> = new Map();

    loadTextures(imageDataList: AssetModel[]): Promise<any> {
      const imagePromises: Promise<TextureData>[] = imageDataList
        .filter(imageData => {
          if (!this.textureMap.has(imageData.id)) {
            return true;
          }
          return this.textureMap.get(imageData.id).fileName !== imageData.fileName;
        })
        .map(imageData => {
          return new Promise((resolve, reject) => {
            try {
              new THREE.TextureLoader().load(
                imageData.filePath,
                texture => resolve(new TextureData(imageData.id, imageData.fileName, texture)
              ));
            }
            catch(error) {
              reject(error);
            }
          });
        });

      return Promise.all(imagePromises)
        .then(imageAssets => imageAssets.forEach((textureData: any) => {
          this.textureMap.set(textureData.id, textureData);
        }));
    }

    loadAudioBuffers(audioDataList: AssetModel[]): Promise<any> {
      const audioContext = getAudioContext();

      const audioPromises = audioDataList
        .filter(audioData => {
          if (!this.audioBufferMap.has(audioData.id)) {
            return true;
          }
          return this.audioBufferMap.get(audioData.id).fileName !== audioData.fileName;
        })
        .map(audioData => {
          const byteString = atob(audioData.filePath.split(',')[1]);
          const arrayBuffer = new ArrayBuffer(byteString.length);
          const byteArray = new Uint8Array(arrayBuffer);
          for (let i = 0; i < byteString.length; i++) {
              byteArray[i] = byteString.charCodeAt(i);
          }
          return {
            meta: audioData,
            arrayBuffer: arrayBuffer
          };
        })
        .map(bundle => {
          try {
            return audioContext.decodeAudioData(bundle.arrayBuffer)
              .then(audioBuffer => {
                const audioData = new AudioData(bundle.meta.id, bundle.meta.fileName, audioBuffer);
                this.audioBufferMap.set(bundle.meta.id, audioData);
                return null;
              });
          }
          catch (error) {
            // Safari 10 does not use the promise based syntax
            // TODO: figure out a more elegant way to handle this situation
            if (error.message === 'Not enough arguments') {
              return new Promise((resolve, reject) => {
                try {
                  audioContext.decodeAudioData(bundle.arrayBuffer, audioBuffer => {
                    const audioData = new AudioData(bundle.meta.id, bundle.meta.fileName, audioBuffer);
                    this.audioBufferMap.set(bundle.meta.id, audioData);
                    resolve();
                  });
                }
                catch (err) {
                  reject(err);
                }
              });
            }
          }
        });

      return Promise.all(audioPromises);
    }

    getTextureById(id: string): Texture {
      if (!this.textureMap.has(id)) return null;
      return this.textureMap.get(id).texture;
    }

    getAudioBufferById(id: string): AudioBuffer {
      if (!this.audioBufferMap.has(id)) return null;
      return this.audioBufferMap.get(id).audioBuffer;
    }

    clearAssets() {
      this.textureMap.clear();
      this.audioBufferMap.clear();
    }

}

class TextureData {
  id: string;
  fileName: string
  texture: Texture;
  constructor(id: string, fileName: string, texture: Texture) {
    this.id = id;
    this.fileName = fileName;
    this.texture = texture;
  }
}

class AudioData {
  id: string;
  fileName: string
  audioBuffer: AudioBuffer;
  constructor(id: string, fileName: string, audioBuffer: AudioBuffer) {
    this.id = id;
    this.fileName = fileName;
    this.audioBuffer = audioBuffer;
  }
}

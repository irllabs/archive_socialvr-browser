import {Injectable} from '@angular/core';
import * as THREE from 'three';

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
                texture => {
                  resolve(new TextureData(imageData.id, imageData.fileName, texture))
                },
                () => {},
                error => {
                  console.log('image texture loading error', imageData, error);
                  resolve(new TextureData(imageData.id, imageData.fileName, null))
                }
              );
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
          return decodeAudioDataOrEmpty(audioContext, bundle.arrayBuffer)
            .then(audioBuffer => {
              const audioData = new AudioData(bundle.meta.id, bundle.meta.fileName, audioBuffer);
              this.audioBufferMap.set(bundle.meta.id, audioData);
              return null;
            });
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

function decodeAudioDataOrEmpty(audioContext, audioArrayBuffer: ArrayBuffer) {
  try {
    return audioContext.decodeAudioData(audioArrayBuffer)
      .catch(error => {
        console.log('decode audio buffer error:', error);
        console.log('attempting to load empty buffer');
        // Return an empty audio buffer
        const emptyBuffer = audioContext.createBuffer(2, audioContext.sampleRate, audioContext.sampleRate);
        return Promise.resolve(emptyBuffer);
      });
  }
  catch(error) {
    if (error.message === 'Not enough arguments') {
      return new Promise((resolve, reject) => {
        try {
          audioContext.decodeAudioData(audioArrayBuffer, audioBuffer => resolve(audioBuffer));
        }
        catch (err) {
          console.log('decode audio buffer error:', error);
          console.log('attempting to load empty buffer');
          // Load empty buffer
          const emptyBuffer = audioContext.createBuffer(2, audioContext.sampleRate, audioContext.sampleRate);
          resolve(emptyBuffer);
        }
      });
    }
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

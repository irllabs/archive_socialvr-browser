import {Injectable} from '@angular/core';

import {AssetInteractor} from 'core/asset/assetInteractor';
import {getAudioContext} from 'ui/editor/util/audioContextProvider';


@Injectable()
export class AudioPlayService {

  private gainNode: GainNode;
  private soundtrack: AudioBufferSourceNode;
  private hotspot: AudioBufferSourceNode;
  private background: AudioBufferSourceNode;

  constructor(private assetInteractor: AssetInteractor) {
    const audioContext = getAudioContext();
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = 2;
    this.gainNode.connect(audioContext.destination);
  }

  //for project soundtrack which cannot be stopped by others
  playSoundtrack(audioAssetId: string) {
    const audioSource = this.getAudioSource(audioAssetId);
    if (audioSource) {
      audioSource.loop = true;
      audioSource.start(0);
      this.soundtrack = audioSource;
    }
  }

  playBgAudio(audioAssetId: string) {
    this.stopPlaying(this.background);
    const audioSource = this.getAudioSource(audioAssetId);
    if (audioSource) {
      audioSource.start(0);
      this.background = audioSource;
    }
  }

  playHotspotAudio(audioAssetId: string) {
    this.stopPlaying(this.hotspot);
    const audioSource = this.getAudioSource(audioAssetId);
    if (audioSource) {
      audioSource.start(0);
      this.hotspot = audioSource;
    }
  }

  stopAll() {
    this.stopPlaying(this.soundtrack);
    this.stopPlaying(this.background);
    this.stopPlaying(this.hotspot);
  }

  stopPlaying(audioBuffer: AudioBufferSourceNode) {
    // Because of webkit not supporting the modern implementation of .stop() and
    // having a dependence on audioBuffer.playbackState.
    // See: https://bugs.webkit.org/show_bug.cgi?id=117142
    if (!audioBuffer) {
      return; // return if empty
    }
    // call .stop() if not on webkit implementation
    if (audioBuffer.playbackState === undefined) {
      audioBuffer.stop();
      return;
    }
    // else, confirm playbackState before calling 'stop'
    if (audioBuffer.playbackState === 1 || audioBuffer.playbackState === 2) {
      audioBuffer.stop();
      return;
    }
  }

  getAudioSource(audioAssetId: string): AudioBufferSourceNode {
    const audioBuffer = this.assetInteractor.getAudioBufferById(audioAssetId);
    if (!audioBuffer) {
      console.log(
        'audioPlayService.playSample error',
        `audio buffer not found for audio ID: ${audioAssetId}`
      );
      return;
    }

    const bufferSource = getAudioContext().createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.connect(this.gainNode);
    return bufferSource;
  }

}

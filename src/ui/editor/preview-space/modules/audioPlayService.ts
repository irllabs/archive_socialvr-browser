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

  stopPlaying(channel: AudioBufferSourceNode) {
    if (channel) {
      channel.stop();
    }
  }

  stopAll() {
    this.stopPlaying(this.soundtrack);
    this.stopPlaying(this.background);
    this.stopPlaying(this.hotspot);
  }

  attemptStopSample(audioBuffer) {
    if (!audioBuffer) {
      return;
    }
    // We should just be able to call .stop, but safari 10 throws an error, so use playbackState
    if (audioBuffer.playbackState === undefined) {
      audioBuffer.stop();
      return;
    }
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

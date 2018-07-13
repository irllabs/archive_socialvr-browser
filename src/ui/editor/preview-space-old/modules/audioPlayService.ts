import { Injectable } from '@angular/core';

import { AssetInteractor } from 'core/asset/assetInteractor';
import { getAudioContext } from 'ui/editor/util/audioContextProvider';


@Injectable()
export class AudioPlayService {
  private gainNode: GainNode;
  private soundtrack: AudioBufferSourceNode;
  private narrationId: string;
  private narration: AudioBufferSourceNode;
  private narrationStart: number;
  private narrationPosition: number = 0;
  private hotspot: AudioBufferSourceNode;
  private background: AudioBufferSourceNode;

  public audioContext: any;

  constructor(private assetInteractor: AssetInteractor) {
    const audioContext = getAudioContext();

    this.audioContext = audioContext;
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.setTargetAtTime(2, 0, 0);
    this.gainNode.connect(audioContext.destination);
  }

  public checkAudioContextState() {
    if (this.isAudioContextSuspended()) {
      this.audioContext.resume();
    }
  }

  public isAudioContextSuspended() {
    return this.audioContext.state === 'suspended';
  }

  //for project soundtrack which cannot be stopped by others
  playSoundtrack(audioAssetId: string, volume: number = 0.5) {
    if (!this.soundtrack) {
      const audioSource = this.getAudioSource(audioAssetId);

      if (audioSource) {
        this.gainNode.gain.value = volume;
        audioSource.loop = true;
        audioSource.start(0);
        this.soundtrack = audioSource;
        this.checkAudioContextState();
      }
    }
  }

  playBgAudio(audioAssetId: string) {
    this.stopPlaying(this.background);

    const audioSource = this.getAudioSource(audioAssetId);

    if (audioSource) {
      audioSource.start(0);
      this.background = audioSource;
      this.checkAudioContextState();
    }
  }

  playHotspotAudio(audioAssetId: string, volume: number = 0.5, loop: boolean = false): AudioBufferSourceNode {
    this.stopPlaying(this.hotspot);
    this.pauseCurrentNarrationAudio();

    const audioSource = this.getAudioSource(audioAssetId);

    if (audioSource) {
      this.gainNode.gain.value = volume;
      audioSource.loop = loop;
      audioSource.start(0);

      this.hotspot = audioSource;
      this.checkAudioContextState();

      return audioSource;
    }
  }

  stopHotspotAudio(audioBuffer: AudioBufferSourceNode){
    this.stopPlaying(audioBuffer);
    this.resumeCurrentNarrationAudio();
  }

  playNarrationAudio(narrationId: string, position: number = 0): AudioBufferSourceNode {
    this.stopPlaying(this.narration);
    this.narrationId = null;

    const audioSource = this.getAudioSource(narrationId);

    if (audioSource) {
      this.gainNode.gain.value = 0.5;
      audioSource.loop = false;
      audioSource.start(0, position);
      this.narrationStart = Date.now();

      this.narration = audioSource;
      this.narrationId = narrationId;
      this.checkAudioContextState();

      return audioSource;
    }
  }

  pauseCurrentNarrationAudio() {
    const audioSource = this.narration;

    if (audioSource) {
      this.narrationPosition += Date.now() - this.narrationStart;
      this.stopPlaying(audioSource);
      this.narration = null;
    }
  }

  resumeCurrentNarrationAudio() {
    const narrationId = this.narrationId;

    if (narrationId) {
      this.playNarrationAudio(narrationId, this.narrationPosition / 1000);
    }
  }

  stopAll(includeSoundtrack: boolean) {
    if (includeSoundtrack) {
      this.stopPlaying(this.soundtrack);
      this.soundtrack = null;
    }

    this.stopPlaying(this.background);
    this.stopPlaying(this.hotspot);
    this.stopPlaying(this.narration);
    this.background = null;
    this.hotspot = null;
    this.narration = null;
    this.narrationPosition = 0;
    this.narrationId = null;
  }

  stopPlaying(audioBuffer: AudioBufferSourceNode) {
    // Because of webkit not supporting the modern implementation of .stop() and
    // having a dependence on audioBuffer.playbackState.
    // See: https://bugs.webkit.org/show_bug.cgi?id=117142
    if (!audioBuffer) {
      return; // return if empty
    }
    // call .stop() if not on webkit implementation
    if (typeof audioBuffer['playbackState'] === 'undefined') {
      audioBuffer.stop();
      return;
    }
    // else, confirm playbackState before calling 'stop'
    if (audioBuffer['playbackState'] === 1 || audioBuffer['playbackState'] === 2) {
      audioBuffer.stop();
      return;
    }
  }

  getAudioSource(audioAssetId: string): AudioBufferSourceNode {
    const audioBuffer = this.assetInteractor.getAudioBufferById(audioAssetId);

    if (!audioBuffer) {
      console.log(
        'audioPlayService.playSample error',
        `audio buffer not found for audio ID: ${audioAssetId}`,
      );
      return;
    }

    const bufferSource = getAudioContext().createBufferSource();

    bufferSource.buffer = audioBuffer;
    bufferSource.connect(this.gainNode);

    return bufferSource;
  }

}

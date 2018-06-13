import { Injectable } from '@angular/core';
import { getAudioContext } from 'ui/editor/util/audioContextProvider';

import { FileLoaderUtil } from 'ui/editor/util/fileLoaderUtil';

const Recorder = require('recorderjs');

@Injectable()
export class AudioRecorderService {

  private recorder;
  private audioNodes;
  private frequencyDataArray: Uint8Array;
  private audioContext;

  constructor(private fileLoaderUtil: FileLoaderUtil) {

  }

  startRecording() {
    this.audioContext = getAudioContext();

    return getMicAudioNode(this.audioContext)
      .then(audioNodes => {
        this.audioNodes = audioNodes;
        this.frequencyDataArray = new Uint8Array(audioNodes.analyserNode.frequencyBinCount);
        this.recorder = new Recorder(audioNodes.micNode);
        this.recorder.record();
      });
  }

  stopRecording() {
    return new Promise((resolve, reject) => {
      try {
        this.recorder.stop();
        this.audioNodes.audioStream.getAudioTracks().forEach(audioTrack => audioTrack.stop());
        this.recorder.exportWAV(audioBlob => {
          const sampleRate = this.audioContext.sampleRate;

          resolve(
            this.fileLoaderUtil.getBinaryFileData(audioBlob.slice(0, -3 * sampleRate, audioBlob.type)),
          );
        });
      }
      catch (error) {
        reject(error);
      }
    });
  }

  getFrequencyData() {
    this.audioNodes.analyserNode.getByteFrequencyData(this.frequencyDataArray);
    return this.frequencyDataArray;
  }
}


function getMicAudioNode(audioContext): Promise<any> {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return (<any>window).navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(audioStream => configureAudio(audioContext, audioStream));
  }
  else {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia({ audio: true, video: false },
        audioStream => resolve(configureAudio(audioContext, audioStream)),
        error => reject(SyntaxError),
      );
    });
  }
}

function configureAudio(audioContext, audioStream) {
  const micGain = audioContext.createGain();
  const micInputStream = audioContext.createMediaStreamSource(audioStream);
  const analyserNode = audioContext.createAnalyser();
  const zeroGainOutput = audioContext.createGain();

  analyserNode.fftSize = 2048;
  zeroGainOutput.gain.setTargetAtTime(0, 0, 0);

  micInputStream.connect(micGain);
  micGain.connect(analyserNode);
  micGain.connect(zeroGainOutput);
  zeroGainOutput.connect(audioContext.destination);

  return {
    audioStream: audioStream,
    micNode: micGain,
    analyserNode: analyserNode,
  };
}

export function browserCanRecordAudio(): boolean {
  return !!navigator.mediaDevices &&
    !!navigator.mediaDevices.getUserMedia &&
    !!navigator.getUserMedia;
}

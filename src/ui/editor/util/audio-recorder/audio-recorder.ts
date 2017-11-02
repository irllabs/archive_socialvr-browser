import {Component, Output, EventEmitter, ViewChild, NgZone} from '@angular/core';

import {AudioRecorderService} from 'ui/editor/util/audioRecorderService';
import {Audio} from 'data/scene/entities/audio';
import {generateUniqueId} from 'data/util/uuid';

//this should really refer to colors inn our variables.scss file
const backgroundColorOff = new Uint8Array([173, 0, 52]);   //i.e. $color-red-dark
const backgroundColorOn = new Uint8Array([255, 53, 113]);  //i.e. $color-pink
const MAX_RECORDING_TIME  = 20000; //20 seconds

@Component({
  selector: 'audio-recorder',
  styleUrls: ['./audio-recorder.scss'],
  templateUrl: './audio-recorder.html'
})
export class AudioRecorder {

  @Output() onRecorded = new EventEmitter();
  @ViewChild('audioRecorder') audioRecorderButton;

  private isRecording: boolean = false;
  private timeoutId: any;
  //private isAnimating: boolean = false;

  constructor(
    private audioRecorderService: AudioRecorderService,
    private ngZone: NgZone
  ) {}

  ngOnDestroy() {
    // cancel current recording
    //this.isAnimating = false;
    if (this.isRecording) {
      this.audioRecorderService.stopRecording()
        .then(dataUrl => {})
        .catch(error => console.error(error));
    }
    clearTimeout(this.timeoutId);
  }

  private onClick($event) {
    this.isRecording ? this.stopRecording() : this.startRecording();
  }

  private startRecording() {
    this.isRecording = true;
    this.audioRecorderService.startRecording()
      .then(resolve => {
        //this.isAnimating = true;
        this.ngZone.runOutsideAngular(this.animateRecordButton.bind(this));
      })
      .catch(error => console.log('error getting mic node', error));

    this.timeoutId = setTimeout(() => {
      if (this.isRecording) {
        this.stopRecording();
      }
    }, MAX_RECORDING_TIME);
  }

  private stopRecording() {
    //this.isAnimating = false;
    this.isRecording = false;
    clearTimeout(this.timeoutId);
    this.audioRecorderService.stopRecording()
      .then(dataUrl => {
        const uniqueId: string = generateUniqueId();
        const audioFileName: string = `${uniqueId}.wav`;
        this.onRecorded.emit({
        	fileName: `${uniqueId}.wav`,
        	dataUrl: dataUrl
        });
      })
      .catch(error => console.error(error));

    this.setButtonColor(`rgb(${backgroundColorOff[0]}, ${backgroundColorOff[1]}, ${backgroundColorOff[2]})`);
  }

  private animateRecordButton() {
    if (!this.isRecording) return;

    const windowFrequencyData = this.audioRecorderService.getFrequencyData();
    const histogramSum = windowFrequencyData.reduce((sum, item) => sum + item, 0);
    const meanValue = histogramSum / windowFrequencyData.length;
    const normalValue = Math.min(meanValue, 100) / 100;
    const color = linearInterpolate(backgroundColorOff, backgroundColorOn, normalValue);
    const cssColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
    this.setButtonColor(cssColor);
    requestAnimationFrame(this.animateRecordButton.bind(this));
  }

  private setButtonColor(color: string) {
    this.audioRecorderButton.nativeElement.setAttribute('style', `background-color: ${color}`);
  }

}

function linearInterpolate(u, v, value) {
  const inverseValue = 1 - value;
  return {
    r: linearInterpolateValue(u[0], v[0], value, inverseValue),
    g: linearInterpolateValue(u[1], v[1], value, inverseValue),
    b: linearInterpolateValue(u[2], v[2], value, inverseValue)
  };
}

function linearInterpolateValue(u, v, value, inverseValue) {
  return Math.floor(u * inverseValue + v * value);
}

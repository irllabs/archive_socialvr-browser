import { Component, EventEmitter, Input, NgZone, Output, ViewChild } from '@angular/core';
import { generateUniqueId } from 'data/util/uuid';

import { AudioRecorderService } from 'ui/editor/util/audioRecorderService';
import { SettingsService } from 'data/settings/settingsService';

//this should really refer to colors inn our variables.scss file
const backgroundColorOff = new Uint8Array([173, 0, 52]);   //i.e. $color-red-dark
const backgroundColorOn = new Uint8Array([255, 53, 113]);  //i.e. $color-pink

@Component({
  selector: 'audio-recorder',
  styleUrls: ['./audio-recorder.scss'],
  templateUrl: './audio-recorder.html',
})
export class AudioRecorder {

  @Output() onRecorded = new EventEmitter();
  @ViewChild('audioRecorder') audioRecorderButton;

  private isRecording: boolean = false;
  private isStarting: boolean = false;
  private intervalId: any;
  private _timerId = null;

  public showTimer: boolean = false;
  public timerCounter: any = '';
  public intervalCounter: any = '';

  //private isAnimating: boolean = false;

  constructor(
    private audioRecorderService: AudioRecorderService,
    private ngZone: NgZone,
    private settingsService: SettingsService
  ) {
  }

  ngOnDestroy() {
    // cancel current recording
    //this.isAnimating = false;
    if (this.isRecording) {
      this.audioRecorderService.stopRecording()
        .then(dataUrl => {
        })
        .catch(error => console.error(error));
    }
    clearInterval(this.intervalId);
  }

  private onClick($event) {
    const notRecording = !this.isRecording;
    const notStarting = !this.isStarting;

    this.clearTimer();

   if (notRecording && notStarting) {
      this.startPreparingCountdown()
    } else if(notStarting) {
      this.stopRecording();
    } else {
      this.stopPreparingCountdown()
    }
  }

  private startPreparingCountdown(){
    this.timerCounter = 3;
    this.showTimer = true;
    this.isStarting = true;
    this._timerId = setInterval(() => {
      this.timerCounter -= 1;

      if (this.timerCounter === 0) {
        this.stopPreparingCountdown();
        this.startRecording();
        
      }
    }, 1000);
  }

  private stopPreparingCountdown(){
    this.clearTimer();
    this.isStarting = false;
  }

  private clearTimer() {
    if (this._timerId) {
      this.timerCounter = '';
      clearInterval(this._timerId);
      this.showTimer = false;
      this._timerId = null;
    }
  }

  private startRecording() {
    console.log('recording')
    this.isRecording = true;
    this.timerCounter = this.settingsService.settings.maxClipDuration;
    this.audioRecorderService.startRecording()
      .then(resolve => {
        //this.isAnimating = true;
        this.ngZone.runOutsideAngular(this.animateRecordButton.bind(this));
      })
      .catch(error => console.log('error getting mic node', error));

    this._timerId = setInterval(() => {
      this.timerCounter -= 1;

      if (this.isRecording && this.timerCounter === 0) {
        this.stopRecording();
      }
    }, 1000);
  }

  private stopRecording() {
    //this.isAnimating = false;
    this.isRecording = false;
    this.clearTimer()
    this.audioRecorderService.stopRecording()
      .then(dataUrl => {
        const uniqueId: string = generateUniqueId();

        this.onRecorded.emit({
          fileName: `${uniqueId}.wav`,
          dataUrl: dataUrl,
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
    b: linearInterpolateValue(u[2], v[2], value, inverseValue),
  };
}

function linearInterpolateValue(u, v, value, inverseValue) {
  return Math.floor(u * inverseValue + v * value);
}

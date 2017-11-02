import {BaseElement} from 'data/scene/entities/baseElement';
import {MediaFile} from 'data/scene/entities/mediaFile';
import {DEFAULT_VOLUME} from 'ui/common/constants';

export class Image extends BaseElement {

  private mediaFile: MediaFile = new MediaFile();
  private _body: string;
  private audioFile: MediaFile = new MediaFile();
  private volume: number = DEFAULT_VOLUME;

  constructor() {
    super();
  }

  getFileName(): string {
    return this.mediaFile.getFileName();
  }

  setFileName(fileName: string) {
    this.mediaFile.setFileName(fileName);
  }

  getBinaryFileData(): any {
    return this.mediaFile.getBinaryFileData();
  }

  setBinaryFileData(binaryFileData: any) {
    return this.mediaFile.setBinaryFileData(binaryFileData);
  }

  setFileData(fileName: string, binaryFileData: string) {
    this.setFileName(fileName);
    this.setBinaryFileData(binaryFileData);
  }

  //added for audio caption
  getAudioFileName(): string {
    return this.audioFile.getFileName();
  }

  setAudioFileName(fileName: string) {
    this.audioFile.setFileName(fileName);
  }

  getAudioBinaryFileData(): any {
    return this.audioFile.getBinaryFileData();
  }

  setAudioBinaryFileData(binaryFileData: any) {
    return this.audioFile.setBinaryFileData(binaryFileData);
  }

  setAudioFileData(fileName: string, volume: number, binaryFileData: string) {
    this.setAudioFileName(fileName);
    this.setAudioVolume(volume);
    this.setAudioBinaryFileData(binaryFileData);
  }

  setAudioVolume(volume: number) {
      if (volume === undefined || volume === null) {
        this.volume = DEFAULT_VOLUME
      }
      else {
        this.volume = volume
      }
    }

  getAudioVolume(): number {
    return this.volume;
  }

  //added for text caption
  get body(): string {
    return this._body;
  }

  set body(body) {
    this._body = body;
  }

  getVolume(): number {
    return this.volume;
  }

  toJson() {
    return Object.assign(super.toJson(), {
      file: encodeURIComponent(this.mediaFile.getFileName()),
      size: '<2,1>', //TODO: get requirements for size vector,
      captionText: this._body,
      captionAudio: encodeURIComponent(this.audioFile.getFileName()),
      captionAudioVolumn: this.getVolume()
    });
  }



}

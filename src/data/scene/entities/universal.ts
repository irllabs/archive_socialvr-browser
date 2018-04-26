import {BaseElement} from 'data/scene/entities/baseElement';
import {MediaFile} from "./mediaFile";
import {DEFAULT_VOLUME} from 'ui/common/constants';
import {DEFAULT_FILE_NAME} from "../../../ui/common/constants";


export class Universal extends BaseElement {
  private _textContent: string;
  private _audioContent: MediaFile = new MediaFile();
  private _imageContent: MediaFile = new MediaFile();
  private _volume: number = DEFAULT_VOLUME;
  private _loop: boolean = false;

  constructor() {
    super();
  }

  get textContent(): string {
    return this._textContent
  }

  set textContent(content: string) {
    this._textContent = (content || '').slice(0, 245);
  }

  get audioContent(): MediaFile {
    return this._audioContent;
  }

  get imageContent(): MediaFile {
    return this._imageContent;
  }

  get volume(): number {
    return this._volume;
  }

  set volume(vol: number) {
    this._volume = (typeof vol === 'undefined' || vol === null) ? DEFAULT_VOLUME : vol;
  }

  get loop(): boolean {
    return this._loop;
  }

  set loop(isLoop: boolean) {
    this._loop = isLoop;
  }

  setAudioContent(fileName: string, binaryFileData: string, volume: number = DEFAULT_VOLUME) {
    this._audioContent.setFileName(fileName);
    this._audioContent.setBinaryFileData(binaryFileData);
    this.volume = volume;
  }

  setImageContent(fileName: string, binaryFileData: string) {
    this._imageContent.setFileName(fileName);
    this._imageContent.setBinaryFileData(binaryFileData);
  }

  resetAudioContent() {
    this.setAudioContent(DEFAULT_FILE_NAME, null);
  }

  resetImageContent() {
    this.setImageContent(DEFAULT_FILE_NAME, null);
  }

  toJson() {
    return Object.assign(super.toJson(), {
      imageFile: encodeURIComponent(this._imageContent.getFileName()),
      audioFile: encodeURIComponent(this._audioContent.getFileName()),
      remoteImageFile: this._imageContent.getRemoteFileName(),
      remoteAudioFile: this._audioContent.getRemoteFileName(),
      text: this._textContent,
      loop: this._loop,
      volume: this._volume,
      size: '<2,1>' //TODO: get requirements for size vector
    });
  }
}

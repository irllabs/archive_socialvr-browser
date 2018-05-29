import { BaseElement } from 'data/scene/entities/baseElement';
import { MediaFile } from 'data/scene/entities/mediaFile';
import { DEFAULT_VOLUME } from 'ui/common/constants';

export class Audio extends BaseElement {
  private mediaFile: MediaFile = new MediaFile();
  private volume: number = DEFAULT_VOLUME;

  constructor() {
    super();

    this.mediaFile = new MediaFile();
  }

  getRemoteFileName(): string {
    return this.mediaFile.getRemoteFile();
  }

  setRemoteFileName(remoteFileName: string) {
    this.mediaFile.setRemoteFile(remoteFileName);
  }

  getMediaFile(): MediaFile {
    return this.mediaFile;
  }

  setMediaFile(mediaFile) {
    this.mediaFile = mediaFile;
  }

  hasAsset(): Boolean {
    return this.mediaFile.hasAsset();
  }

  getFileName(): string {
    return this.mediaFile.getFileName();
  }

  setFileName(fileName: string) {
    this.mediaFile.setFileName(fileName);
  }

  getBinaryFileData(unsafe: boolean = false): any {
    return this.mediaFile.getBinaryFileData(unsafe);
  }

  setBinaryFileData(binaryFileData: any) {
    return this.mediaFile.setBinaryFileData(binaryFileData);
  }

  setFileData(fileName: string, volume: number, binaryFileData: string) {
    this.setFileName(fileName);
    this.setVolume(volume);
    this.setBinaryFileData(binaryFileData);
  }

  setVolume(volume: number) {
    if (volume === undefined || volume === null) {
      this.volume = DEFAULT_VOLUME;
    }
    else {
      this.volume = volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  toJson() {
    return Object.assign(super.toJson(), {
      file: this.mediaFile.getFileName(),
      remoteFile: this.mediaFile.getRemoteFile(),
      volume: this.getVolume(),
    });
  }
}

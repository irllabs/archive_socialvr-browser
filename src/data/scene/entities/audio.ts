import {BaseElement} from 'data/scene/entities/baseElement';
import {MediaFile} from 'data/scene/entities/mediaFile';
import {DEFAULT_VOLUME} from 'ui/common/constants';

export class Audio extends BaseElement {

  private mediaFile: MediaFile = new MediaFile();
  private volume: number = DEFAULT_VOLUME;

  constructor() {
    super();
  }

  getRemoteFileName(): string {
    return this.mediaFile.getRemoteFileName();
  }

  setRemoteFileName(remoteFileName: string) {
    this.mediaFile.setRemoteFileName(remoteFileName);
  }

  getMediaFile(): MediaFile {
    return this.mediaFile;
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

  getBinaryFileData(): any {
    return this.mediaFile.getBinaryFileData();
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
        this.volume = DEFAULT_VOLUME
      }
      else {
        this.volume = volume
      }
    }

  getVolume(): number {
    return this.volume;
  }

  toJson() {
    return Object.assign(super.toJson(), {
      file: encodeURIComponent(this.mediaFile.getFileName()),
      remoteFile: this.mediaFile.getRemoteFileName(),
      volume: this.getVolume()
    });
  }

}

import { BaseElement } from 'data/scene/entities/baseElement';
import { MediaFile } from 'data/scene/entities/mediaFile';

export class Image extends BaseElement {
  private mediaFile: MediaFile = new MediaFile();

  constructor() {
    super();
  }

  public setMediaFile(mediaFile) {
    this.mediaFile = mediaFile;
  }

  getMediaFile(): MediaFile {
    return this.mediaFile;
  }

  hasAsset(): boolean {
    return this.mediaFile.hasAsset();
  }

  getRemoteFileName(): string {
    return this.mediaFile.getRemoteFile();
  }

  setRemoteFileName(remoteFileName: string) {
    this.mediaFile.setRemoteFile(remoteFileName);
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

  setFileData(fileName: string, binaryFileData: string) {
    this.setFileName(fileName);
    this.setBinaryFileData(binaryFileData);
  }

  toJson() {
    return Object.assign(super.toJson(), {
      file: this.mediaFile.getFileName(),
      remoteFile: this.mediaFile.getRemoteFile(),
      size: '<2,1>', //TODO: get requirements for size vector
    });
  }
}

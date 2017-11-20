import {BaseElement} from 'data/scene/entities/baseElement';
import {MediaFile} from 'data/scene/entities/mediaFile';

export class Image extends BaseElement {

  private mediaFile: MediaFile = new MediaFile();

  constructor() {
    super();
  }

  getMediaFile(): MediaFile {
    return this.mediaFile;
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

  toJson() {
    return Object.assign(super.toJson(), {
      file: encodeURIComponent(this.mediaFile.getFileName()),
      remoteFile: this.mediaFile.getRemoteFileName(),
      size: '<2,1>' //TODO: get requirements for size vector
    });
  }

}

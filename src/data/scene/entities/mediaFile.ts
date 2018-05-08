export class MediaFile {
  public needToRedraw: boolean = true;

  private fileName: string;
  private remoteFileName: string;
  private binaryFileData: any;

  getFileName(): string {
    if (this.fileName === undefined || this.fileName === null) {
      return '';
    } else {
      return this.fileName;
    }
  }

  setFileName(fileName: string) {
    this.fileName = fileName;
  }

  getBinaryFileData(): any {
    return this.binaryFileData;
  }

  setBinaryFileData(binaryFileData: any) {
    this.binaryFileData = binaryFileData;
    this.needToRedraw = true;
  }

  getRemoteFileName(): string {
    if (this.remoteFileName === undefined || this.remoteFileName === null) {
      return '';
    } else {
      return this.remoteFileName;
    }
  }

  setRemoteFileName(remoteFileName: string) {
    this.remoteFileName = remoteFileName;
  }

  isUploaded(): boolean {
    return !!this.getRemoteFileName();
  }

  hasAsset(): boolean {
    return !!this.binaryFileData;
  }

}

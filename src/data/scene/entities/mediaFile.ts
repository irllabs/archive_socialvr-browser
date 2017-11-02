export class MediaFile {

  private fileName: string;
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
  }

  hasAsset(): boolean {
    return !!this.binaryFileData;
  }

}

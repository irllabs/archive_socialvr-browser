import { v4 as uuid } from 'uuid';

export class MediaFile {
  public storedRemoteFile: string = null;
  private _objectUrl: string = null;
  private _fileName: string = null;
  private _mimeType: string = null;
  private _remoteFile: string = null;
  private _binaryFileData: any = null;
  private _needToDraw: boolean = false;
  private _needToUpload: boolean = false;
  private _needToDelete: boolean = false;

  constructor(data = null) {
    if (data) {
      this._fileName = data.fileName;
      this._remoteFile = data.remoteFile;
      this._binaryFileData = data.binaryFileData;
      this._mimeType = data.mimeType;

      this.setStoredRemoteFile(data.remoteFile);
    }
  }

  public get mimeType(): string {
    return this._mimeType;
  }

  public set mimeType(mimeType: string) {
    this._mimeType = mimeType;
  }

  // File extension
  public get ext(): string {
    if (this.mimeType) {
      const mimeTypeParts = this.mimeType.split('/');

      return mimeTypeParts[mimeTypeParts.length - 1];
    }
    return 'png';
  }

  public draw(callback) {
    if (this._needToDraw) {
      callback();
      this._needToDraw = false;
    }
  }

  public hasRemoteFileToDelete(): boolean {
    return this._needToDelete;
  }
  
  public needToUpload(): boolean {
    return this._needToUpload || (!this._remoteFile && !!this._binaryFileData);
  }

  public setStoredRemoteFile(file: string) {
    this.storedRemoteFile = file;
    this._needToDelete = false;
  }

  public getFileName(): string {
    return this._fileName || '';
  }

  public setFileName(fileName: string) {
    this._fileName = fileName;
  }

  public getBinaryFileData(unsafe: boolean = false): any {
    if (unsafe && this._binaryFileData && this._binaryFileData.changingThisBreaksApplicationSecurity) {
      return this._binaryFileData.changingThisBreaksApplicationSecurity;
    }

    return this._binaryFileData;
  }

  public setBinaryFileData(binaryFileData: any) {
    this._needToUpload = binaryFileData !== null;
    this._needToDelete = !!this.storedRemoteFile;
    this._binaryFileData = binaryFileData;
    this._needToDraw = true;

    if (binaryFileData) {
      this._updateMimeType();
      //Change object url to new value if its already defined.
      if(this._objectUrl){
        this.setObjectUrl();
      }
      
    }

    this._setNewName();
  }

  public setUploadedBinaryFileData(binaryFileData: any) {
    this._needToUpload = false;
    this._needToDelete = false;
    this._binaryFileData = binaryFileData;
    this._needToDraw = true;
  }

  public getRemoteFile(): string {
    return this._remoteFile || '';
  }

  public setRemoteFile(remoteFile: string) {
    this._remoteFile = remoteFile;
  }

  public hasAsset(): boolean {
    return !!this._binaryFileData;
  }

  public getBlob(): Blob {
    const dataUrlString = this.getBinaryFileData(true);
    const byteString = atob(dataUrlString.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: this.mimeType });
  }

  public getObjectUrl(): string {

    if (!this._objectUrl) {
      this.setObjectUrl();
    }

    return this._objectUrl;
  }

  public setObjectUrl() {
    this._objectUrl = URL.createObjectURL(this.getBlob())
  }

  private _setNewName() {
    this._fileName = `asset-${uuid()}.${this.ext}`;
  }

  private _updateMimeType() {
    const base64String = this.getBinaryFileData(true);

    if (base64String) {
      const mime = base64String.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);

      if (mime && mime.length) {
        this.mimeType = mime[1];

        return;
      }
    }

    this.mimeType = 'image/png';
  }
}

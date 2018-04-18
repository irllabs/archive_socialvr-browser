import {BaseElement} from 'data/scene/entities/baseElement';


export class Video extends BaseElement {
  private _body: string = ''; //'https://drive.google.com/file/d/1QmdECMurs5aWLKpTpOXyU5ruAr6YyDdn/view?usp=sharing';
  private _fileId: string = ''; // '1QmdECMurs5aWLKpTpOXyU5ruAr6YyDdn';
  private _isValid: boolean = false;
  private _validateRegexp: RegExp = /https:\/\/(drive|docs)\.google\.com\/file\/d\/(.*?)\//i;

  constructor() {
    super();
  }

  get isValid(): boolean {
    return this._isValid;
  }

  get body(): string {
    return this._body;
  }

  get fileId(): string {
    return this._fileId;
  }

  get hasValidUrl(): string {
    return this.isValid && this.fileId;
  }

  get exportUrl(): string {
    return `/uc?export=download&id=${this.fileId}`;
  }

  get fullExportUrl(): string {
    return `https://drive.google.com/uc?export=download&id=${this.fileId}`;
  }

  set body(body) {
    this._isValid = this.validateYouTubeUrl(body);
    this._body = body;
  }

  validateYouTubeUrl(url, checkEmpty: boolean = false) {
    if (!checkEmpty && url === "") {
      return true;
    }

    const match = url && url.match(this._validateRegexp);
    const isValid = match && match.length === 3;

    if(isValid) {
      this._fileId = match[2];
    }

    return isValid;
  }

  toJson() {
    return Object.assign(super.toJson(), {
      file: this._body
    });
  }
}

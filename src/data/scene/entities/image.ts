import {BaseElement} from 'data/scene/entities/baseElement';
import {MediaFile} from 'data/scene/entities/mediaFile';
import {DEFAULT_VOLUME} from 'ui/common/constants';
import {Audio} from 'data/scene/entities/audio';
import {Text} from 'data/scene/entities/text';

export class Image extends BaseElement {

  private mediaFile: MediaFile = new MediaFile();
  public audio: Audio = new Audio();
  public text: Text = new Text();

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


  toJson() {
    return Object.assign(super.toJson(), {
      file: encodeURIComponent(this.mediaFile.getFileName()),
      size: '<2,1>', //TODO: get requirements for size vector,
      //text: this.text.toJson(),
      text: this.text.body,
      //audio: this.audio.toJson()
      audio: encodeURIComponent(this.audio.getFileName()),
      volume: this.audio.getVolume()
    });
  }



}

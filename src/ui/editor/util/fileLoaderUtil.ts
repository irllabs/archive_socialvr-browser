import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import {
  MIME_TYPE_AAC,
  MIME_TYPE_JPEG,
  MIME_TYPE_JPG,
  MIME_TYPE_MP3,
  MIME_TYPE_MP4,
  MIME_TYPE_MPEG,
  MIME_TYPE_OCTET_STREAM,
  MIME_TYPE_PNG,
  MIME_TYPE_WAV,
  MIME_TYPE_X_ZIP,
  MIME_TYPE_X_ZIP_COMPRESSED,
  MIME_TYPE_XM4A,
  MIME_TYPE_XWAV,
  MIME_TYPE_ZIP,
} from 'ui/common/constants';

export const mimeTypeMap = {
  video: [MIME_TYPE_MP4], //TODO: uncomment to continue working on video
  audio: [MIME_TYPE_MP3, MIME_TYPE_WAV, MIME_TYPE_MPEG, MIME_TYPE_XWAV, MIME_TYPE_AAC, MIME_TYPE_XM4A],
  image: [MIME_TYPE_PNG, MIME_TYPE_JPG, MIME_TYPE_JPEG],
  zip: [MIME_TYPE_ZIP, MIME_TYPE_X_ZIP, MIME_TYPE_OCTET_STREAM, MIME_TYPE_X_ZIP_COMPRESSED],
};

@Injectable()
export class FileLoaderUtil {

  constructor(private sanitizer: DomSanitizer) {
  }

  validateFileLoadEvent(file, acceptedFileType) {
    return new Promise((resolve, reject) => {
      if (!mimeTypeMap[acceptedFileType]) {
        reject('Accepted file type not valid');
      }
      if (mimeTypeMap[acceptedFileType].indexOf(file.type) < 0) {
        const errorMessage: string = `File is not a valid type, must be of type: ${acceptedFileType}.\nAccepted file types: ${mimeTypeMap[acceptedFileType].join(', ')}`;
        reject(errorMessage);
      }
      resolve(file);
    });
  }

  getBinaryFileData(file): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const fileReader = new FileReader();

        fileReader.onloadend = () => {
          resolve(this.getFileData(fileReader.result));
        };

        fileReader.onerror = () => {
          const error = fileReader.error;

          console.log('fileLoader.onerror', error);
          reject(error);
        };

        fileReader.readAsDataURL(file);
      });
    });
  }

  getFileData(base64Date) {
    return this.sanitizer.bypassSecurityTrustUrl(base64Date);
  }
}

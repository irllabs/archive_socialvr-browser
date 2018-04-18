import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

const POLICY_STORAGE: string = 'POLICY_STORAGE';

@Injectable()
export class AssetService {

  private uploadPolicy: any;

  constructor() {}

  getUploadPolicy() {
    if (!this.uploadPolicy && sessionStorage) {
      const uploadPolicy = sessionStorage.getItem(POLICY_STORAGE);

      this.uploadPolicy = JSON.parse(uploadPolicy);
    }
    return this.uploadPolicy;
  }

  setUploadPolicy(uploadPolicy: any) {
    if (sessionStorage) {
      sessionStorage.setItem(POLICY_STORAGE, JSON.stringify(uploadPolicy));
    }
    this.uploadPolicy = uploadPolicy;
  }

  clearUploadPolicy() {
    if (sessionStorage) {
      sessionStorage.removeItem(POLICY_STORAGE);
    }
    this.uploadPolicy = undefined;
  }

}

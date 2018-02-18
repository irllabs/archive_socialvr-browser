import {Injectable} from '@angular/core';

import {CameraService} from 'data/scene/cameraService';

@Injectable()
export class CameraInteractor {

  constructor(private cameraService: CameraService) {}

  getCameraAngles() {
    return this.cameraService.getCameraAngles();
  }

  setCameraAngles(cameraAngles) {
    this.cameraService.setCameraAngles(cameraAngles);
  }

}

import {Injectable} from '@angular/core';

import {CameraService} from 'data/scene/cameraService';

@Injectable()
export class CameraInteractor {

  constructor(private cameraService: CameraService) {}

  getCameraDirection() {
    return this.cameraService.getCameraDirection();
  }

  setCameraDirection(x: number, y: number, z: number) {
    this.cameraService.setCameraDirection(x, y, z);
  }

}

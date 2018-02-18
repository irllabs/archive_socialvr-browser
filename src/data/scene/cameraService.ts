import { Injectable } from '@angular/core';

@Injectable()
export class CameraService {

  private cameraAngles;

  getCameraAngles() {
    return this.cameraAngles;
  }

  setCameraAngles(cameraAngles) {
    this.cameraAngles = cameraAngles;
  }

}

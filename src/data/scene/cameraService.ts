import { Injectable } from '@angular/core';

@Injectable()
export class CameraService {

  private direction = {x: 0, y: 0, z: 0};

  getCameraDirection() {
    return this.direction;
  }

  setCameraDirection(x: number, y: number, z: number) {
    this.direction.x = x;
    this.direction.y = y;
    this.direction.z = z;
  }

}

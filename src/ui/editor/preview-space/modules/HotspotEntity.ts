import * as THREE from 'three';

import {THREE_CONST} from 'ui/common/constants';
import BasePlane from "../planes/base-plane";


export default class HotspotEntity {
  id: string; //THREE.js mesh id
  distanceToReticle: number;
  activeState: number; //0 for far, 1 for near, 2 for active
  activeStateLast: number;
  plane: BasePlane;  // this is for hotspots that grow and how you something, like text/image/link
  myWobble: number;
  scale: number;

  private wasActivated: boolean = false;

  constructor(plane: BasePlane) {
    this.id = plane.uuid;
    this.plane = plane;
    this.myWobble = Math.random() / 1000; //to make each hotspot have a uniquye throbbing freq
    this.activeState = 0; //everybody starts far away
    this.activeStateLast = -1; //to make sure something happens the first time
    this.scale = this.plane.previewIconMesh.scale.x;
    this.plane.iconMesh.visible = true;
    this.plane.previewIconMesh.visible = true;
  }

  update(reticlePos) {
    const hotspotPosition: THREE.Vector3 = new THREE.Vector3();

    this.plane.iconMesh.getWorldPosition(hotspotPosition);
    this.distanceToReticle = hotspotPosition.distanceTo(reticlePos);

    // TODO: improve it using the Promises. It will solve some bugs.
    if (this.distanceToReticle > THREE_CONST.HOTSPOT_NEAR) {
      this.activeState = 0;
    } else if ((this.distanceToReticle < THREE_CONST.HOTSPOT_NEAR)
      && (this.distanceToReticle > THREE_CONST.HOTSPOT_ACTIVE)) {
      this.activeState = 1;
    } else if (this.distanceToReticle < THREE_CONST.HOTSPOT_ACTIVE) {
      this.activeState = 2;
    }

    if (this.activeState !== this.activeStateLast) {
      switch (this.activeState) {
        case 0:
          // far away
          switch (this.activeStateLast) {
            case 1:
              // switch from preview to graphic
              this.resetTweens();
              if (this.wasActivated) {
                this.deactivate().then(() => {
                  this.wasActivated = false;
                  this.graphic2preview();
                });
              } else {
                this.graphic2preview();
              }
              break;
            case 2:
              // switch from graphic to preview + deactivate
              this.resetTweens();
              this.deactivate(this.wasActivated).then(() => {
                this.wasActivated = false;
              });
              this.graphic2preview();
              break;
          }
          break;
        case 1:
          switch (this.activeStateLast) {
            case 0:
              // switch from preview to graphic
              this.resetTweens();
              this.preview2graphic();
              break;
            case 2:
              // switch from graphic to preview + deactivate
              this.resetTweens();
              this.deactivate().then(() => {
                this.wasActivated = false;
                this.preview2graphic();
              });
              break;
          }
          break;
        case 2:
          // activate
          this.wasActivated = true;
          this.activate();
          break;
      }

      this.activeStateLast = this.activeState;
    } else {
      this.plane.update();
    }

    //animations
    if (this.activeState == 0) {
      if (this.plane.type == 'door') {
        const previewIconScale = (1. - (performance.now() % THREE_CONST.HOTSPOT_DOOR_FREQ) / THREE_CONST.HOTSPOT_DOOR_FREQ) + 0.01;

        this.plane.previewIconMesh.scale.set(
          this.scale * previewIconScale,
          this.scale * previewIconScale,
          1
        );
      } else {
        const previewIconScale = (Math.sin(performance.now() * (THREE_CONST.HOTSPOT_MOD_FREQ + this.myWobble)) * THREE_CONST.HOTSPOT_MOD_MAG);

        this.plane.previewIconMesh.scale.set(
          this.plane.previewIconMesh.scale.x + previewIconScale,
          this.plane.previewIconMesh.scale.y + previewIconScale,
          1
        );
      }
    }
  }

  resetTweens() {
    this.plane.resetAnimations();
  }

  activate() {
    return this.plane.activate();
  }

  deactivate(onlyPlaneAnimation: boolean = false) {
    return this.plane.deactivate(onlyPlaneAnimation);
  }

  graphic2preview() {
    return this.plane.hoverOut();
  }

  preview2graphic() {
    return this.plane.hoverIn();
  }
}

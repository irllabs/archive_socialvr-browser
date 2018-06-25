import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { THREE_CONST } from 'ui/common/constants';

@Injectable()
export class Reticle {

  private touchReticle: THREE.Group;
  private vrReticle: THREE.Group;
  private camera: THREE.PerspectiveCamera;
  private vrCamera: THREE.PerspectiveCamera;
  private reticleRaycaster: THREE.Raycaster = new THREE.Raycaster();
  private position: THREE.Vector3;

  constructor() {
  }

  init(camera: THREE.PerspectiveCamera, vrCamera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.vrCamera = vrCamera;
    const reticleRingGeometry = new THREE.RingGeometry(
      THREE_CONST.RETICLE_INNER,
      THREE_CONST.RETICLE_OUTER,
      THREE_CONST.RETICLE_SEGS); //inner radius, outer radius, segments
    const reticleRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      opacity: 0.5,
      transparent: true,
      side: THREE.FrontSide,
    });
    const reticleRingMesh = new THREE.Mesh(reticleRingGeometry, reticleRingMaterial);
    const reticleBackgroundGeometry = new THREE.CircleGeometry(
      THREE_CONST.RETICLE_BACK_RADIUS,
      THREE_CONST.RETICLE_SEGS); //radius, segments
    const reticleBackgroundMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      opacity: 0.5,
      transparent: true,
      side: THREE.FrontSide,
    });
    const reticleBackgroundMesh = new THREE.Mesh(reticleBackgroundGeometry, reticleBackgroundMaterial);
    const reticle = new THREE.Group();
    reticle.add(reticleRingMesh);
    reticle.add(reticleBackgroundMesh);

    //added by ali for improved placement
    reticle.position.set(0, 0, -1 * THREE_CONST.CAMERA_RETICLE);

    this.touchReticle = reticle.clone();
    this.vrReticle = reticle.clone();
    this.vrReticle.visible = false;
    this.camera.add(this.touchReticle);
    this.vrCamera.add(this.vrReticle);
  }

  showVrReticle(isInVrMode: boolean) {
    this.vrReticle.visible = isInVrMode;
    this.touchReticle.visible = !isInVrMode;
  }

  getActiveReticle(isInVrMode: boolean) {
    return isInVrMode ? this.vrReticle : this.touchReticle;
  }

  getRaycaster(): THREE.Raycaster {
    return this.reticleRaycaster;
  }

  update(isInVrMode: boolean) {
    const camera = isInVrMode ? this.vrCamera : this.camera;
    const reticle = isInVrMode ? this.vrReticle : this.touchReticle;

    this.position = reticle.getWorldPosition(null);
    this.reticleRaycaster.setFromCamera(new THREE.Vector2, camera);

    // if (intersectedMeshList.length) {
    // 	if (this.activeHotspotId !== intersectedMeshList[0].object.uuid) {
    // 		this.activeHotspotId = intersectedMeshList[0].object.uuid;
    //     this.requestHotspotActivation(this.activeHotspotId);
    // 	}
    // }
    // // No intersection between the reticle vector and geometry
    // else {
    // 	if (this.activeHotspotId) {
    //     // TODO: menu????
    //     const activeHotspot = this.hotspotManager.getHotspot(this.activeHotspotId);
    //     // const activeHotspot = this.hotspotMeshMap.get(this.activeHotspotId);
    //     if (activeHotspot && activeHotspot.mesh) {
    //       //activeHotspot.mesh.scale.set(1, 1, 1);
    //       this.triggerHotspot(activeHotspot.id, this.activeHotspotId, 'deactivate');
    //     }
    //   }
    // 	this.activeHotspotId = '';
    // }
    // //icon transition (only menu buttons have name, they do not need trasition)
    // meshList.filter(mesh => !mesh.name).forEach(mesh => this.iconTransition(mesh, reticle));
  }

}

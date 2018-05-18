import {Injectable} from '@angular/core';
import * as THREE from 'three';

import HotspotEntity, { HOTSPOT_ANIM_STATES } from 'ui/editor/preview-space/modules/HotspotEntity';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {AssetInteractor} from 'core/asset/assetInteractor';
import {AudioPlayService} from 'ui/editor/preview-space/modules/audioPlayService';
import PlaneResolver from "../planes/plane-resolver";


@Injectable()
export class HotspotManager {

  //String is the THREE.js unique id of the hotspot mesh
  private hotspotMap: Map<String, HotspotEntity> = new Map();
  private onRoomChange: Function;

  constructor(
    private sceneInteractor: SceneInteractor,
    private assetInteractor: AssetInteractor,
    private audioPlayService: AudioPlayService,
  ) {
  }

  load(scene: THREE.Scene, camera: THREE.PerspectiveCamera, onRoomChange: Function) {
    this.onRoomChange = onRoomChange;
    this.cleanMaps(scene);

    // Hotspot Icons - add preview and graphic icons to the scene, create map
    const roomId: string = this.sceneInteractor.getActiveRoomId();

    this.sceneInteractor.getRoomProperties(roomId).forEach((roomProperty) => {
      //add to hotspotEntity map
      const plane = PlaneResolver.resolve(roomProperty, camera, this.assetInteractor, {
        audioPlayService: this.audioPlayService,
        goToRoom: onRoomChange
      });
      const hotspotEntity = new HotspotEntity(plane);

      // add Meshes to scene
      scene.add(plane.iconMesh);
      scene.add(plane.previewIconMesh);
      scene.add(plane.labelMesh);

      // some hotspots don't have a mesh plane (e.g Audio)
      if (plane.hasPlaneMesh) {
        scene.add(plane.render());
      }

      this.hotspotMap.set(plane.uuid, hotspotEntity);
    });
  }

  //clean up three.js scene
  cleanMaps(scene: THREE.Scene) {
    this.hotspotMap.forEach((hotspotEntity) => {
      const plane = hotspotEntity.plane;

      plane.dispose(scene);
    });

    this.hotspotMap.clear();
    this.hotspotMap = new Map();
  }

  getHotspot(hotspotId: string): HotspotEntity {
    return this.hotspotMap.get(hotspotId);
  }

  update(reticle, elapsedTime: number) {
    const reticlePosition: THREE.Vector3 = new THREE.Vector3();
    const activatedHotspots = [];
    let minDistance = null;
    let activated = null;

    reticle.getWorldPosition(reticlePosition);

    this.hotspotMap.forEach((hotspotEntity) => {
      hotspotEntity.preUpdate(reticlePosition);

      if (hotspotEntity.state === HOTSPOT_ANIM_STATES.ACTIVE) {
        activatedHotspots.push(hotspotEntity);

        if (minDistance === null || hotspotEntity.distanceToReticle < minDistance) {
          minDistance = hotspotEntity.distanceToReticle;
          activated = hotspotEntity;
        }
      }
    });

    this.hotspotMap.forEach((h) => {
      if (!!activated && h !== activated) {
        h.state = HOTSPOT_ANIM_STATES.HIDE;
      }

      h.update();
    });
  }
}

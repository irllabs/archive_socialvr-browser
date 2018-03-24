import {Injectable} from '@angular/core';
import * as THREE from 'three';

import IdMeshPair from 'ui/editor/preview-space/modules/idMeshPair';
import HotspotEntity from 'ui/editor/preview-space/modules/HotspotEntity';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {AssetInteractor} from 'core/asset/assetInteractor';
import {RoomPropertyTypeService} from 'ui/editor/util/roomPropertyTypeService';
import {AudioPlayService} from 'ui/editor/preview-space/modules/audioPlayService';
import {RoomManager} from 'data/scene/roomManager';
import {MenuManager} from 'ui/editor/preview-space/modules/menuManager';
import {Image} from 'data/scene/entities/image';
import {Text} from 'data/scene/entities/text';
import {Link} from 'data/scene/entities/link';
import {Audio} from 'data/scene/entities/audio';
import {Door} from 'data/scene/entities/door';
import {RoomProperty} from 'data/scene/interfaces/roomProperty';
import {buildMaterialFromText} from 'ui/editor/preview-space/modules/textMaterialBuilder';
import {fitToMax} from 'data/util/imageResizeService';
import {getCoordinatePosition} from 'ui/editor/util/iconPositionUtil';
import {EventBus} from 'ui/common/event-bus';
import * as MeshUtil from 'ui/editor/preview-space/modules/meshUtil';
import {sphericalToCoordinate, coordinateToSpherical, car2pol, pol2car} from 'ui/editor/util/iconPositionUtil';
import {THREE_CONST} from 'ui/common/constants';
import fontHelper from 'ui/editor/preview-space/modules/fontHelper';

const SCALE = 0.001;

function buildDashCircle(): THREE.Group {
  const dashCircleGeom = new THREE.CircleGeometry(THREE_CONST.HOTSPOT_DIM, THREE_CONST.DASHCIRCLE_SEG);
  const dashCircleMaterial = new THREE.LineDashedMaterial({
    color: 0xFFFFFF,
    dashSize: 2,
    gapSize: 2,
    linewidth: 1
  });
  dashCircleGeom.vertices.shift();
  const line = new THREE.Line(dashCircleGeom, dashCircleMaterial);
  line.computeLineDistances();
  const group = new THREE.Group();
  group.add(line);
  return group;
}

@Injectable()
export class HotspotManager {

  //String is the THREE.js unique id of the hotspot mesh
  private hotspotMap: Map<String, HotspotEntity> = new Map();
  private activateHotspotTimeout: number;
  private doorTimerMesh: THREE.Mesh;
  private doorTimerTheta: number = 0;
  private buildTimerMesh: Function;
  private doorTimerCleaner: Function;
  private tempOutgoingRoomId: string = '';
  private lastRoomId: string = '';
  private onRoomChange: Function;
  private activeHotspotId: string = '';
  // private dashCircleLine: THREE.Line;

  constructor(
    private sceneInteractor: SceneInteractor,
    private assetInteractor: AssetInteractor,
    private audioPlayService: AudioPlayService,
    private roomManager: RoomManager,
    private menuManager: MenuManager,
    private eventBus: EventBus
  ) {}

  load(scene: THREE.Scene, camera: THREE.PerspectiveCamera, onRoomChange: Function) {
    this.onRoomChange = onRoomChange;
    this.cleanMaps(scene);


    // Hotspot Icons - add preview and graphic icons to the scene, create map
    const roomId: string  = this.sceneInteractor.getActiveRoomId();
    this.sceneInteractor.getRoomProperties(roomId).forEach(roomProperty => {

      const location = roomProperty.getLocation();
      //console.log(roomProperty);
      const position = getCoordinatePosition(location.getX(), location.getY());
      //console.log('position', position);
      const labelText = roomProperty.getName();
      const propertyType: string = RoomPropertyTypeService.getTypeString(roomProperty);
      const squareGeometry = new THREE.PlaneGeometry(THREE_CONST.HOTSPOT_DIM, THREE_CONST.HOTSPOT_DIM);
      const hotspotTexture = this.assetInteractor.getTextureById(propertyType);

      //create graphic icon for hotspot, i.e. our hotspot icons
      const squareMaterial = new THREE.MeshBasicMaterial({map: hotspotTexture,  transparent: true, side:THREE.FrontSide});
      const squareMesh = new THREE.Mesh(squareGeometry, squareMaterial);

      // const squareMesh = threeResourcePool.getGraphicIcon(hotspotTexture);
      const polPol = car2pol(position.x, position.y, position.z);
      const posCar = pol2car(THREE_CONST.CAMERA_HOTSPOT,polPol.y,polPol.z);
      squareMesh.position.set(posCar.x, posCar.y, posCar.z);
      squareMesh.lookAt(camera.position);
      squareMesh.material.opacity = 0;
      scene.add(squareMesh);
      const meshRotation = squareMesh.position;

      //create preview icon for hotspot, i.e. dash circle
      // const dashCircle: THREE.Line = this.dashCircleLine.clone();
      // var dashCircleGroup = new THREE.Group();
      const dashCircleGroup = buildDashCircle();
      // dashCircleGroup.add(dashCircle);

      // const dashCircleGroup = threeResourcePool.getDashCircle();
      dashCircleGroup.position.set(position.x, position.y, position.z);
      dashCircleGroup.lookAt(camera.position);
      dashCircleGroup.visible = true;
      scene.add(dashCircleGroup);

      //create label for each hotpost, i.e. the name of the hotspotEntity
      const fontProperties = {
        font: fontHelper.getBaseFont(),
    		size: THREE_CONST.FONT_HOTSPOT_SIZE,
    		height: THREE_CONST.FONT_HOTSPOT_HEIGHT,
    		curveSegments: 12,
    		bevelEnabled: false,
    		bevelThickness: 4,
    		bevelSize: 8,
    		bevelSegments: 5
      };
      const labelMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
      const labelGeometry = new THREE.TextGeometry(roomProperty.getName(), fontProperties);
      labelGeometry.computeBoundingBox();
      labelGeometry.computeVertexNormals();
      labelGeometry.center();
      const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
      // const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
      // const labelMesh = threeResourcePool.getLabel(roomProperty.getName());
      labelMesh.position.set(position.x, position.y - 40, position.z);
      labelMesh.lookAt(camera.position);
      labelMesh.visible = false;
      scene.add(labelMesh);

      //add to hotspotEntity map
      const thisHotspot = new HotspotEntity(squareMesh.uuid,roomProperty,squareMesh,dashCircleGroup, this.audioPlayService, onRoomChange, labelMesh, meshRotation);
      this.hotspotMap.set(squareMesh.uuid, thisHotspot);

      if (propertyType === 'image') {
        const imageProperty = roomProperty as Image;
        const imagePlane = this.buildExpandedImagePlane(imageProperty, camera);
        scene.add(imagePlane);
        this.hotspotMap.get(squareMesh.uuid).plane = imagePlane;
      }
      else if (propertyType === 'text') {
        const textProperty = roomProperty as Text;
        const textPlane = this.buildExpandedTextPlane(textProperty, camera);
        scene.add(textPlane);
        this.hotspotMap.get(squareMesh.uuid).plane = textPlane;
      }
      else if (propertyType === 'link') {
        const linkProperty = roomProperty as Link;
        const linkPlane = this.buildExpandedLinkPlane(linkProperty, camera);
        scene.add(linkPlane);
        this.hotspotMap.get(squareMesh.uuid).plane = linkPlane;
      }
    });
  }

  buildExpandedImagePlane(imageProperty: Image, camera: THREE.PerspectiveCamera): THREE.Mesh {
    const imageTexture = this.assetInteractor.getTextureById(imageProperty.getId());
    const location = imageProperty.getLocation();
    const position = getCoordinatePosition(location.getX(), location.getY(), 250);
    if (imageTexture) {
      const geometryDimensions = fitToMax(imageTexture.image.width, imageTexture.image.height, 140);
      const imageGeometry = new THREE.PlaneGeometry(geometryDimensions.getX(), geometryDimensions.getY());
      const imageMaterial = new THREE.MeshBasicMaterial({map: imageTexture, transparent: true, side:THREE.FrontSide, alphaMap: this.assetInteractor.getTextureById('imageMask')});
      const imageMesh = new THREE.Mesh(imageGeometry, imageMaterial);
      imageMesh.position.set(position.x, position.y, position.z);
      imageMesh.lookAt(camera.position);
      imageMesh.material.opacity = 1;
      imageMesh.scale.set(SCALE,SCALE,SCALE);
      return imageMesh;
    }

    // error case: image hotspot without an image, use a transparent grey square
    console.log('Error: building image hotspot without an image');
    const materailData = buildMaterialFromText('');
    const textGeometry = new THREE.PlaneGeometry(14, 14);
    const textMesh = new THREE.Mesh(textGeometry, materailData.material);
    textMesh.position.set(position.x, position.y, position.z);
    textMesh.lookAt(camera.position);
    textMesh.material.opacity = 1;
    textMesh.scale.set(SCALE,SCALE,SCALE);
    return textMesh;
  }

  // TODO: move to resource pool
  buildExpandedTextPlane(textProperty: Text, camera: THREE.PerspectiveCamera): THREE.Mesh {
    const location = textProperty.getLocation();
    const position = getCoordinatePosition(location.getX(), location.getY(), 250);
    const materailData = buildMaterialFromText(textProperty.body);
    const geometryDimensions = fitToMax(materailData.width, materailData.height, 140);
    const textGeometry = new THREE.PlaneGeometry(geometryDimensions.getX(), geometryDimensions.getY());
    const textMesh = new THREE.Mesh(textGeometry, materailData.material);
    textMesh.position.set(position.x, position.y, position.z);
    textMesh.lookAt(camera.position);
    textMesh.material.opacity = 1;
    textMesh.scale.set(SCALE,SCALE,SCALE);
    return textMesh;
  }

  buildExpandedLinkPlane(linkProperty: Link, camera: THREE.PerspectiveCamera): THREE.Mesh {
    const location = linkProperty.getLocation();
    const position = getCoordinatePosition(location.getX(), location.getY(), 250);
    const materailData = buildMaterialFromText(linkProperty.body);
    const geometryDimensions = fitToMax(materailData.width, materailData.height, 140);
    const linkGeometry = new THREE.PlaneGeometry(geometryDimensions.getX(), geometryDimensions.getY());
    const linkMesh = new THREE.Mesh(linkGeometry, materailData.material);
    linkMesh.position.set(position.x, position.y, position.z);
    linkMesh.lookAt(camera.position);
    linkMesh.material.opacity = 1;
    linkMesh.scale.set(SCALE,SCALE,SCALE);
    return linkMesh;
  }

  //clean up three.js scene
  cleanMaps(scene: THREE.Scene) {
    this.hotspotMap.forEach(idHotspotPair => {
      // DASHED CIRCLE
      idHotspotPair.previewIcon.children.forEach((child) => {
        if (child.material) {
          child.material.dispose();
        }
        if (child.geometry) {
          child.geometry.dispose();
        }
        scene.remove(child);
      });
      scene.remove(idHotspotPair.previewIcon);
      // HOTSPOT ICON
      idHotspotPair.graphicIcon.material.map.dispose();
      idHotspotPair.graphicIcon.material.dispose();
      idHotspotPair.graphicIcon.geometry.dispose();
      scene.remove(idHotspotPair.graphicIcon);
      // HOTSPOT LABEL
      idHotspotPair.label.material.dispose();
      idHotspotPair.label.geometry.dispose();
      idHotspotPair.label.geometry = undefined;
      scene.remove(idHotspotPair.label);
      // ACTIVATED HOTSPOT
      if (idHotspotPair.plane) {
        idHotspotPair.plane.material.map.dispose();
        idHotspotPair.plane.material.dispose();
        idHotspotPair.plane.geometry.dispose();
        scene.remove(idHotspotPair.plane);
      }
      idHotspotPair = undefined;
    });
    this.hotspotMap.clear();
    this.hotspotMap = new Map();
  }

  getHotspot(hotspotId: string): HotspotEntity {
    return this.hotspotMap.get(hotspotId);
  }

  update(reticle, elapsedTime: number) {
    let reticlePosition: THREE.Vector3 = new THREE.Vector3();
    reticle.getWorldPosition(reticlePosition);
    this.hotspotMap.forEach((hotspotEntity, id) => {
      hotspotEntity.update(reticlePosition);
    });
  }

}

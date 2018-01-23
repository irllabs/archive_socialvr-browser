import * as THREE from 'three';
import {THREE_CONST} from 'ui/common/constants';
import fontHelper from 'ui/editor/preview-space/modules/fontHelper';
import {fitToMax} from 'data/util/imageResizeService';

const HOTSPOT_LIMIT = 10;
const IS_IN_USE = 'isInUse';

const labelMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});

function buildDashCircle(): THREE.Group {
  const dashCircleGeom = new THREE.CircleGeometry(THREE_CONST.HOTSPOT_DIM, THREE_CONST.DASHCIRCLE_SEG);
  const dashCircleMaterial = new THREE.LineDashedMaterial({ color: 0xFFFFFF, dashSize: 2, gapSize: 2, linewidth:1 });
  dashCircleGeom.vertices.shift();
  dashCircleGeom.computeLineDistances();
  const line = new THREE.Line(dashCircleGeom,dashCircleMaterial);
  const group = new THREE.Group();
  group.add(line);
  return group;
}

function buildGraphicIcon(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(THREE_CONST.HOTSPOT_DIM, THREE_CONST.HOTSPOT_DIM);
  const material = new THREE.MeshBasicMaterial({map: null,  transparent: true, side:THREE.FrontSide});
  return new THREE.Mesh(geometry, material);
}

function buildLabel(fontProperties): THREE.Mesh {
  // TODO: try reusing same material variable
  const labelMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
  const labelGeometry = new THREE.TextGeometry('text', fontProperties);
  labelGeometry.computeBoundingBox();
  labelGeometry.computeVertexNormals();
  labelGeometry.center();
  return new THREE.Mesh(labelGeometry, labelMaterial);
}

function buildImagePlane(): THREE.Mesh {
  // TODO: use same geometry?
  const imageGeometry = new THREE.PlaneGeometry(100, 75);
  const imageMaterial = new THREE.MeshBasicMaterial({
    map: null,
    transparent: true,
    side:THREE.FrontSide,
    // alphaMap: this.assetInteractor.getTextureById('imageMask') // TODO
  });
  return new THREE.Mesh(imageGeometry, imageMaterial);
}

function arrayFromRange(size) {
  return new Array(size).fill(null).map((val, index) => index);
}

class ObjectResourcePool {

  private resources;

  constructor(resources) {
    this.resources = resources;
  }

  getResource() {
    const availableIndex = this.resources.findIndex(obj => !obj.userData[IS_IN_USE]);
    if (availableIndex < 0) {
      throw new Error('pool overflow');
    }
    this.resources[availableIndex].userData[IS_IN_USE] = true;
    return this.resources[availableIndex];
  }

  releaseResource(resource) {
    resource.userData[IS_IN_USE] = false;
    const usage = this.resources.map(circle => circle.userData[IS_IN_USE]);
    console.log('realease obj', usage);
  }

}

class ThreeResourcePool {

  private sphereMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({map: null, side: THREE.BackSide});
  private dashCircles: ObjectResourcePool;
  private graphicIcons: ObjectResourcePool;
  private labels: ObjectResourcePool;
  private imagePlanes: ObjectResourcePool;
  private fontProperties: any;

  init() {
    if (this.dashCircles) {
      return;
    }

    this.fontProperties = {
      font: fontHelper.getBaseFont(),
      size: THREE_CONST.FONT_HOTSPOT_SIZE,
      height: THREE_CONST.FONT_HOTSPOT_HEIGHT,
      curveSegments: 12,
      bevelEnabled: false,
      bevelThickness: 4,
      bevelSize: 8,
      bevelSegments: 5
    };

    const dashCircleResources = arrayFromRange(HOTSPOT_LIMIT).map(buildDashCircle);
    const graphicIconResources = arrayFromRange(HOTSPOT_LIMIT).map(buildGraphicIcon);
    const labelResources = arrayFromRange(HOTSPOT_LIMIT).map(() => buildLabel(this.fontProperties));
    const imagePlaneResources = arrayFromRange(HOTSPOT_LIMIT).map(buildImagePlane);

    this.dashCircles = new ObjectResourcePool(dashCircleResources);
    this.graphicIcons = new ObjectResourcePool(graphicIconResources);
    this.labels = new ObjectResourcePool(labelResources);
    this.imagePlanes = new ObjectResourcePool(imagePlaneResources);
  }

  getSphereMaterialFromTexture(texture: THREE.Texture) {
    if (this.sphereMaterial.map) {
      console.log('dispose sphere material texture');
      this.sphereMaterial.map.dispose();
    }
    this.sphereMaterial.map = texture;
    return this.sphereMaterial;
  }

  getDashCircle(): THREE.Group {
    return this.dashCircles.getResource();
  }

  releaseDashCircle(circle: THREE.Group) {
    circle.children.forEach(child => {
      if (child.material) {
        child.material.dispose();
      }
      if (child.geometry) {
        child.geometry.dispose();
      }
    });

    this.dashCircles.releaseResource(circle);
  }

  getGraphicIcon(texture: THREE.Texture) {
    const graphicIcon = this.graphicIcons.getResource();
    graphicIcon.material.map = texture;
    return graphicIcon;
  }

  releaseGraphicIcon(graphicIcon: THREE.Mesh) {
    graphicIcon.material.map.dispose();
    graphicIcon.material.dispose();
    graphicIcon.geometry.dispose();

    this.graphicIcons.releaseResource(graphicIcon);
    // if (graphicIcon.material.map) {
      // console.log('dispose graphic icon texture');
      // graphicIcon.material.map.dispose();
    // }
  }

  getLabel(label: string): THREE.Mesh {
    const labelMesh = this.labels.getResource();
    const labelGeometry = new THREE.TextGeometry(label, this.fontProperties);
    labelGeometry.computeBoundingBox();
    labelGeometry.computeVertexNormals();
    labelGeometry.center();
    labelMesh.geometry = labelGeometry;
    return labelMesh;
  }

  releaseLabel(labelMesh: THREE.Mesh) {
    // labelMesh.material.map.dispose();
    labelMesh.material.dispose();
    labelMesh.geometry.dispose();
    labelMesh.geometry = undefined;
    this.labels.releaseResource(labelMesh);
  }

  getImagePlane(texture: THREE.Texture): THREE.Mesh {
    const imagePlane = this.imagePlanes.getResource();
    const geometryDimensions = fitToMax(texture.image.width, texture.image.height, 140);
    imagePlane.material.map = texture;
    // imagePlane.scale.set(geometryDimensions.x, geometryDimensions.y);
    return imagePlane;
  }

  releaseImagePlane(imagePlane: THREE.Mesh) {
    console.log('imagePlane', imagePlane);
    imagePlane.material.map.dispose();
    imagePlane.material.dispose();
    imagePlane.geometry.dispose();
    this.imagePlanes.releaseResource(imagePlane);
  }


}




const threeResourcePool = new ThreeResourcePool();
export default threeResourcePool;

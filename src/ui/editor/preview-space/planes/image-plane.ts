import BasePlane from "./base-plane";
import * as THREE from "three";
import {getCoordinatePosition} from "../../util/iconPositionUtil";
import {fitToMax} from "data/util/imageResizeService";
import {Image} from "data/scene/entities/image";
import {buildMaterialFromText} from "../modules/textMaterialBuilder";


export default class ImagePlane extends BasePlane {
  protected _hasPlaneMesh: boolean = true;

  static buildMesh(texture, textureMask, position, camera): THREE.Mesh {
    const geometryDimensions = fitToMax(texture.image.width, texture.image.height, 140);
    const imageGeometry = new THREE.PlaneGeometry(geometryDimensions.getX(), geometryDimensions.getY());
    const imageMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.FrontSide,
      alphaMap: textureMask
    });
    const imageMesh = new THREE.Mesh(imageGeometry, imageMaterial);

    imageMesh.position.set(position.x, position.y, position.z);
    imageMesh.lookAt(camera.position);
    imageMesh.material['opacity'] = 1;
    imageMesh.scale.set(ImagePlane.SCALE, ImagePlane.SCALE, ImagePlane.SCALE);

    return imageMesh;
  }

  protected _render(): THREE.Mesh {
    const imageProperty = this.prop as Image;
    const imageTexture = this.assetInteractor.getTextureById(imageProperty.getId());
    const location = imageProperty.getLocation();
    const position = getCoordinatePosition(location.getX(), location.getY(), 250);

    if (imageTexture) {
      return ImagePlane.buildMesh(
        imageTexture,
        this.assetInteractor.getTextureById('imageMask'),
        position,
        this.camera
      );
    }

    // error case: image hotspot without an image, use a transparent grey square
    console.error('Error: building image hotspot without an image');
    const materailData = buildMaterialFromText('');
    const textGeometry = new THREE.PlaneGeometry(14, 14);
    const textMesh = new THREE.Mesh(textGeometry, materailData.material);

    textMesh.position.set(position.x, position.y, position.z);
    textMesh.lookAt(this.camera.position);
    textMesh.material['opacity'] = 1;
    textMesh.scale.set(ImagePlane.SCALE, ImagePlane.SCALE, ImagePlane.SCALE);

    return textMesh;
  }
}

import BasePlane from "./base-plane";
import * as THREE from "three";
import {getCoordinatePosition} from "../../util/iconPositionUtil";
import {fitToMax} from "data/util/imageResizeService";
import {buildMaterialFromText} from "../modules/textMaterialBuilder";
import {Text} from "data/scene/entities/text";


export default class TextPlane extends BasePlane {
  protected _hasPlaneMesh: boolean = true;

  static buildMesh(materialData, position, camera): THREE.Mesh {
    const geometryDimensions = fitToMax(materialData.width, materialData.height, 140);
    const textGeometry = new THREE.PlaneGeometry(geometryDimensions.getX(), geometryDimensions.getY());
    const textMesh = new THREE.Mesh(textGeometry, materialData.material);

    textMesh.position.set(position.x, position.y, position.z);
    textMesh.lookAt(camera.position);
    textMesh.material['opacity'] = 1;
    textMesh.scale.set(TextPlane.SCALE, TextPlane.SCALE, TextPlane.SCALE);

    return textMesh;
  }

  protected _render(): THREE.Mesh {
    const textProperty = this.prop as Text;
    const location = textProperty.getLocation();
    const position = getCoordinatePosition(location.getX(), location.getY(), 250);
    const materialData = buildMaterialFromText(textProperty.body);

    return TextPlane.buildMesh(materialData, position, this.camera);
  }
}

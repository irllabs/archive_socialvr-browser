import BasePlane from "./base-plane";
import * as THREE from "three";
import {getCoordinatePosition} from "../../util/iconPositionUtil";
import {fitToMax} from "data/util/imageResizeService";
import {buildMaterialFromText} from "../modules/textMaterialBuilder";
import {Link} from "data/scene/entities/link";


export default class LinkPlane extends BasePlane {
  protected _hasPlaneMesh: boolean = true;

  protected _render(): THREE.Mesh {
    const linkProperty = this.prop as Link;
    const location = linkProperty.getLocation();
    const position = getCoordinatePosition(location.getX(), location.getY(), 250);
    const materialData = buildMaterialFromText(linkProperty.body);
    const geometryDimensions = fitToMax(materialData.width, materialData.height, 140);
    const linkGeometry = new THREE.PlaneGeometry(geometryDimensions.getX(), geometryDimensions.getY());
    const linkMesh = new THREE.Mesh(linkGeometry, materialData.material);

    linkMesh.position.set(position.x, position.y, position.z);
    linkMesh.lookAt(this.camera.position);
    linkMesh.material['opacity'] = 1;
    linkMesh.scale.set(LinkPlane.SCALE, LinkPlane.SCALE, LinkPlane.SCALE);

    return linkMesh;
  }
}

import { AssetInteractor } from 'core/asset/assetInteractor';
import { BaseElement } from 'data/scene/entities/baseElement';
import * as THREE from 'three';
import { THREE_CONST } from '../../../common/constants';
import { car2pol, getCoordinatePosition, pol2car } from '../../util/iconPositionUtil';
import { RoomPropertyTypeService } from '../../util/roomPropertyTypeService';
import fontHelper from '../modules/fontHelper';

const TWEEN = require('@tweenjs/tween.js');


export default class BasePlane {
  static SCALE: number = 0.001;

  private _tweenActivate;
  private _tweenDeactivate;
  private _activating: boolean = false;

  protected _hasPlaneMesh: boolean = false;
  protected _delayBeforeRunActivation = 0;

  protected _tweenIconActivate;
  protected _tweenIconDeactivate;

  protected _tweenPreviewIconIn;
  protected _tweenPreviewIconOut;
  protected _tweenIconIn;
  protected _tweenIconOut;

  protected prop: BaseElement;
  protected camera: THREE.PerspectiveCamera;
  protected assetInteractor: AssetInteractor;

  protected hoverIconGeometry(): any {
    return new THREE.CircleGeometry(THREE_CONST.HOTSPOT_DIM, THREE_CONST.DASHCIRCLE_SEG);
  }

  protected hoverIconTexture() {
    return this.assetInteractor.getTextureById('hotspot-hover');
  }

  public uuid: string;
  public type: string;
  public planeMesh: THREE.Mesh;
  public iconMesh: THREE.Mesh;
  public previewIconMesh: THREE.Group;
  public labelMesh: THREE.Mesh;

  public get hasPlaneMesh(): boolean {
    return this._hasPlaneMesh;
  }

  constructor(roomProperty: any, camera: THREE.PerspectiveCamera, assetInteractor: AssetInteractor) {
    this.prop = roomProperty;
    this.type = RoomPropertyTypeService.getTypeString(this.prop);
    this.camera = camera;
    this.assetInteractor = assetInteractor;

    this._renderIconsAndLabel();
    this.uuid = this.iconMesh.uuid;
  }

  private _renderIconsAndLabel() {
    const location = this.prop.getLocation();
    const position = getCoordinatePosition(location.getX(), location.getY());
    const polPol = car2pol(position.x, position.y, position.z);
    const posCar = pol2car(THREE_CONST.CAMERA_HOTSPOT, polPol.y, polPol.z);

    // Render iconMesh
    const iconGeometry = this.hoverIconGeometry();
    const iconTexture = this.hoverIconTexture();
    const iconMaterial = new THREE.MeshBasicMaterial({
      map: iconTexture,
      transparent: true,
      side: THREE.FrontSide,
    });

    this.iconMesh = new THREE.Mesh(iconGeometry, iconMaterial);
    this.iconMesh.position.set(posCar.x, posCar.y, posCar.z);
    this.iconMesh.lookAt(this.camera.position);
    this.iconMesh.material['opacity'] = 0;

    // render previewIconMesh
    const previewIconGeometry = new THREE.CircleGeometry(2 * THREE_CONST.HOTSPOT_DIM, THREE_CONST.DASHCIRCLE_SEG);
    const iconPreviewTexture = this.assetInteractor.getTextureById('hotspot-default');
    const iconPreviewMaterial = new THREE.MeshBasicMaterial({
      map: iconPreviewTexture,
      transparent: true,
      side: THREE.FrontSide,
    });

    this.previewIconMesh = new THREE.Mesh(previewIconGeometry, iconPreviewMaterial);
    this.previewIconMesh.position.set(position.x, position.y, position.z);
    this.previewIconMesh.lookAt(this.camera.position);
    this.previewIconMesh.visible = true;

    // render labelMesh
    const fontProperties = {
      font: fontHelper.getBaseFont(),
      size: THREE_CONST.FONT_HOTSPOT_SIZE,
      height: THREE_CONST.FONT_HOTSPOT_HEIGHT,
      curveSegments: 12,
      bevelEnabled: false,
      bevelThickness: 4,
      bevelSize: 8,
      bevelSegments: 5,
    };
    const labelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const labelGeometry = new THREE.TextGeometry(this.prop.getName(), fontProperties);

    labelGeometry.computeBoundingBox();
    labelGeometry.computeVertexNormals();
    labelGeometry.center();

    this.labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
    this.labelMesh.position.set(position.x, position.y - 40, position.z);
    this.labelMesh.lookAt(this.camera.position);
    this.labelMesh.visible = false;
  }

  private _animateActivate() {
    const duration = this.get_activate_duration(THREE_CONST.TWEEN_PLANE_IN);

    return new Promise((resolve) => {
      if (this.hasPlaneMesh) {
        this.planeMesh.visible = true;
        this._tweenActivate = new TWEEN.Tween(this.planeMesh.scale)
          .to({
            x: THREE_CONST.TWEEN_PLANE_SCALE,
            y: THREE_CONST.TWEEN_PLANE_SCALE,
            z: 1,
          }, duration)
          .easing(TWEEN.Easing.Linear.None)
          .onComplete(() => {
            TWEEN.remove(this._tweenActivate);
            resolve();
          })
          .start();
      } else {
        resolve();
      }
    });
  }

  private _animateDeactivate() {
    return new Promise((resolve) => {
      if (this.hasPlaneMesh) {
        this._tweenDeactivate = new TWEEN.Tween(this.planeMesh.scale)
          .to({ x: .001, y: .001, z: 1 }, THREE_CONST.TWEEN_PLANE_OUT)
          .easing(TWEEN.Easing.Linear.None)
          .onComplete(() => {
            TWEEN.remove(this._tweenDeactivate);
            this.planeMesh.visible = false;
            resolve();
          })
          .start();
      } else {
        resolve();
      }
    });
  }

  protected _animateIconActivate() {
    const duration = this.get_activate_duration(THREE_CONST.TWEEN_ICON_OUT);

    return new Promise((resolve) => {
      this._tweenIconActivate = new TWEEN.Tween(this.iconMesh.material)
        .to({ opacity: 0 }, duration)
        .easing(TWEEN.Easing.Linear.None)
        .onComplete(() => {
          TWEEN.remove(this._tweenIconActivate);

          this.iconMesh.visible = false;
          this.labelMesh.visible = false;
          resolve();
        })
        .start();
    });
  }

  protected get_activate_duration(defaultDuration): number {
    return defaultDuration;
  }

  protected _animateIconDeactivate() {
    return new Promise((resolve) => {
      this._tweenIconDeactivate = new TWEEN.Tween(this.iconMesh.material)
        .to({ opacity: 1 }, THREE_CONST.TWEEN_ICON_IN)
        .easing(TWEEN.Easing.Linear.None)
        .onComplete(() => {
          TWEEN.remove(this._tweenIconDeactivate);

          this.iconMesh.visible = true;
          this.labelMesh.visible = true;
          resolve();
        })
        .start();
    });
  }

  protected _render(): any {
    return null;
  }

  public onActivated() {
  }

  public onDeactivated() {
  }

  public render(): THREE.Mesh {
    this.planeMesh = this._render();

    return this.planeMesh;
  }

  public update() {
  }

  public dispose(scene: THREE.Scene) {
    const mesh = this.planeMesh;

    if (mesh) {
      if (mesh.material) {
        mesh.material['map'] && mesh.material['map'].dispose();
        mesh.material['dispose'] && mesh.material['dispose']();
      }

      scene.remove(mesh);
    }

    // Remove Preview Icon mesh
    this.previewIconMesh.children.forEach((child) => {
      if (child['material']) {
        child['material'].dispose();
      }
      if (child['geometry']) {
        child['geometry'].dispose();
      }
      scene.remove(child);
    });

    scene.remove(this.previewIconMesh);

    // Remove Icon mesh
    this.iconMesh.material['map'] && this.iconMesh.material['map'].dispose();
    this.iconMesh.material['dispose'] && this.iconMesh.material['dispose']();
    this.iconMesh.geometry.dispose();
    scene.remove(this.iconMesh);

    // Remove Label mesh
    this.labelMesh.material['dispose'] && this.labelMesh.material['dispose']();
    this.labelMesh.geometry.dispose();
    this.labelMesh.geometry = undefined;
    scene.remove(this.labelMesh);
  }

  public activate() {
    this._activating = true;

    return new Promise((resolve) => {
      setTimeout(resolve, this._delayBeforeRunActivation);
    }).then(() => {
      if (this._activating) {
        return Promise.all([this._animateActivate(), this._animateIconActivate()]).then(() => {

          if (this._activating) {
            this.onActivated();
          }

          return this._activating;
        });
      }

      return this._activating;
    });
  }

  public deactivate(onlyPlaneAnimation: boolean = false) {
    const promises = [this._animateDeactivate()];

    this._activating = false;

    if (!onlyPlaneAnimation) {
      promises.push(this._animateIconDeactivate());
    }

    return Promise.all(promises).then(() => {
      this.onDeactivated();
    });
  }

  public hoverOut() {
    return new Promise((resolve) => {
      this.resetIconInAnimations();
      this.labelMesh.visible = false;
      this.previewIconMesh.visible = true;
      this._tweenPreviewIconIn = new TWEEN.Tween(this.previewIconMesh.scale)
        .to({
          x: 1,
          y: 1,
          z: 1,
        }, THREE_CONST.TWEEN_ICON_IN)
        .easing(TWEEN.Easing.Linear.None)
        .onComplete(() => {
          TWEEN.remove(this._tweenPreviewIconIn);
        })
        .start();

      this._tweenIconOut = new TWEEN.Tween(this.iconMesh.material)
        .to({
          opacity: 0,
        }, THREE_CONST.TWEEN_ICON_OUT)
        .easing(TWEEN.Easing.Linear.None)
        .onComplete(() => {
          this.iconMesh.visible = false;
          TWEEN.remove(this._tweenIconOut);
          resolve();
        })
        .start();
    });
  }

  public hoverIn() {
    return new Promise((resolve) => {
      this.resetIconOutAnimations();
      this._tweenPreviewIconOut = new TWEEN.Tween(this.previewIconMesh.scale)
        .to({
          x: 0.001,
          y: 0.001,
          z: 0.001,
        }, THREE_CONST.TWEEN_ICON_OUT)
        .easing(TWEEN.Easing.Linear.None)
        .onComplete(() => {
          this.previewIconMesh.visible = false;
          TWEEN.remove(this._tweenPreviewIconOut);
        })
        .start();

      this.iconMesh.visible = true;
      this._tweenIconIn = new TWEEN.Tween(this.iconMesh.material)
        .to({
          opacity: 1,
        }, THREE_CONST.TWEEN_ICON_IN)
        .easing(TWEEN.Easing.Linear.None)
        .onComplete(() => {
          this.labelMesh.visible = true;
          TWEEN.remove(this._tweenIconIn);
          resolve();
        })
        .start();
    });
  }

  public resetActivateAnimation() {
    if (this._tweenActivate) {
      this._tweenActivate.stop();
    }
  }

  public resetDeactivateAnimation() {
    if (this._tweenDeactivate) {
      this._tweenDeactivate.stop();
    }
  }

  public resetIconInAnimations() {
    if (this._tweenPreviewIconOut) {
      this._tweenPreviewIconOut.stop();
    }
    if (this._tweenIconIn) {
      this._tweenIconIn.stop();
    }
  }

  public resetIconOutAnimations() {
    if (this._tweenPreviewIconIn) {
      this._tweenPreviewIconIn.stop();
    }
    if (this._tweenIconOut) {
      this._tweenIconOut.stop();
    }
  }
}

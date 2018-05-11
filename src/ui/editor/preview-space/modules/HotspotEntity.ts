import * as THREE from 'three';

import { THREE_CONST } from 'ui/common/constants';
import BasePlane from '../planes/base-plane';


const STATES = {
  FAR: 1,
  NEAR: 2,
  ACTIVE: 3,
};

export default class HotspotEntity {
  id: string; //THREE.js mesh id
  distanceToReticle: number;
  activeState: number; //0 for far, 1 for near, 2 for active
  activeStateLast: number;
  plane: BasePlane;  // this is for hotspots that grow and how you something, like text/image/link
  myWobble: number;
  scale: number;

  private _prevState: number = STATES.FAR;
  private _currentState: number = null;
  private _activateAnimation: boolean = false;
  private _deactivateAnimation: boolean = false;

  private get _transitions() {
    return {
      [`${STATES.FAR}TO${STATES.NEAR}`]: this._animateDefaultToPreview.bind(this),
      [`${STATES.FAR}TO${STATES.ACTIVE}`]: this._animateDefaultToActivate.bind(this),
      [`${STATES.NEAR}TO${STATES.FAR}`]: this._animatePreviewToDefault.bind(this),
      [`${STATES.NEAR}TO${STATES.ACTIVE}`]: this._animatePreviewToActivate.bind(this),
      [`${STATES.ACTIVE}TO${STATES.FAR}`]: this._animateActivateToDefault.bind(this),
      [`${STATES.ACTIVE}TO${STATES.NEAR}`]: this._animateActivateToPreview.bind(this),
    };
  }

  private get _currentActivateArea(): number {
    const activateArea = THREE_CONST.HOTSPOT_ACTIVE;

    return activateArea * (this._prevState === STATES.ACTIVE ? 2 : 1);
  }

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

  private getActualState(reticlePos): number {
    const hotspotPosition: THREE.Vector3 = new THREE.Vector3();

    this.plane.iconMesh.getWorldPosition(hotspotPosition);

    const distanceToReticle = hotspotPosition.distanceTo(reticlePos);

    if (distanceToReticle < this._currentActivateArea) {
      return STATES.ACTIVE;
    } else if (distanceToReticle < THREE_CONST.HOTSPOT_NEAR) {
      return STATES.NEAR;
    } else {
      return STATES.FAR;
    }
  }

  private _animateDefaultToPreview(): void {
    this.plane.hoverIn();
  }

  private _animateDefaultToActivate(): void {
    if (this._deactivateAnimation) {
      this.plane.resetDeactivateAnimation();
    }

    this._activateAnimation = true;
    this.plane.activate().then(() => this._activateAnimation = false);
  }

  private _animatePreviewToDefault(): void {
    this.plane.hoverOut();
  }

  private _animatePreviewToActivate(): void {
    if (this._deactivateAnimation) {
      this.plane.resetDeactivateAnimation();
    }

    this._activateAnimation = true;
    this.plane.activate().then(() => this._activateAnimation = false);
  }

  private _animateActivateToDefault(): void {
    if (this._activateAnimation) {
      this.plane.resetActivateAnimation();
    }

    this._deactivateAnimation = true;
    this.plane.deactivate(true).then(() => this._deactivateAnimation = false);
  }

  private _animateActivateToPreview(): void {
    if (this._activateAnimation) {
      this.plane.resetActivateAnimation();
    }

    this._deactivateAnimation = true;
    this.plane.deactivate(false).then(() => this._deactivateAnimation = false);
    ;
  }

  public update(reticlePos): void {
    const newState = this.getActualState(reticlePos);

    if (this._currentState === null) {
      this._currentState = newState;
    }

    const prevState = this._prevState;

    if (newState === prevState) {
      this.plane.update();
    } else {
      const transition = this._transitions[`${prevState}TO${newState}`];

      this._prevState = newState;
      this._currentState = newState;
      transition.call(this);
    }


    if (newState === STATES.FAR) {
      if (this.plane.type === 'door') {
        const previewIconScale = (1. - (performance.now() % THREE_CONST.HOTSPOT_DOOR_FREQ) / THREE_CONST.HOTSPOT_DOOR_FREQ) + 0.01;

        this.plane.previewIconMesh.scale.set(
          this.scale * previewIconScale,
          this.scale * previewIconScale,
          1,
        );
      } else {
        const previewIconScale = (Math.sin(performance.now() * (THREE_CONST.HOTSPOT_MOD_FREQ + this.myWobble)) * THREE_CONST.HOTSPOT_MOD_MAG);

        this.plane.previewIconMesh.scale.set(
          this.plane.previewIconMesh.scale.x + previewIconScale,
          this.plane.previewIconMesh.scale.y + previewIconScale,
          1,
        );
      }
    }
  }
}

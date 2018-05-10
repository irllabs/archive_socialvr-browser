import * as THREE from 'three';
import { THREE_CONST } from 'ui/common/constants';
import BasePlane from "./base-plane";
import {Door} from "data/scene/entities/door";


export default class DoorPlane extends BasePlane {
  private position;
  private goToRoom: Function;

  protected _hasPlaneMesh: boolean = false;
  protected _delayBeforeRunActivation = 1000;

  protected get hoverIconGeometry(): any {
    return new THREE.PlaneGeometry(THREE_CONST.HOTSPOT_DIM, THREE_CONST.HOTSPOT_DIM);
  }

  protected get hoverIconTexture() {
    return this.assetInteractor.getTextureById(this.type);
  }

  protected get_activate_duration(defaultDuration): number {
    return (<Door>this.prop).getAutoTime() * 1000 || defaultDuration;
  }

  public init(position, goToRoom) {
    this.position = position;
    this.goToRoom = goToRoom;
  }

  public onActivated() {
    const outgoingRoomId = (<Door>this.prop).getRoomId();

    this.goToRoom(outgoingRoomId, this.position);
  }

  public onDeactivated() {
  }
}

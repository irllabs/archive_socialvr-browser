import BasePlane from "./base-plane";
import {Door} from "data/scene/entities/door";


export default class DoorPlane extends BasePlane {
  private position;
  private goToRoom: Function;

  protected _hasPlaneMesh: boolean = false;

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

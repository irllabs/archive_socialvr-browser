import {Injectable, NgZone, ChangeDetectorRef} from '@angular/core';

import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';

import {EventBus, EventType} from 'ui/common/event-bus';
import {SceneInteractor} from 'core/scene/sceneInteractor';
import {Room} from 'data/scene/entities/room';
import {RoomIcon} from 'ui/editor/edit-space/room-icon/room-icon/room-icon';
import {RoomProperty} from 'data/scene/interfaces/roomProperty';
import {denormalizePosition} from 'ui/editor/util/iconPositionUtil';
import {Vector2} from 'data/scene/entities/vector2';

const HOTSPOT_DISTANCE_THESH = 80;

@Injectable()
export class CombinedHotspotUtil {

  private activeNeighborId: string = '';
  private roomIconList: RoomIcon[];

  constructor(
    private sceneInteractor: SceneInteractor,
    private ngZone: NgZone,
    private eventBus: EventBus
  ) {

    this.eventBus.getObservable(EventType.SELECT_PROPERTY)
      .subscribe(
        event => {
          this.activeNeighborId = '';
        },
        error => console.log('CombinedHotspotUtil.init', error)
      );
  }

  public setRoomPropertyList(roomIconList: RoomIcon[]) {
    this.roomIconList = roomIconList;
  }

  public onIconMove(roomProperty: RoomProperty, x: number, y: number) {
    const previousActiveNeighborId: string = this.activeNeighborId;
    const activeRoomId: string = this.sceneInteractor.getActiveRoomId();

    const nearestNeighbor = this.roomIconList
      .map(roomIcon => {
        const screenPosition = roomIcon.getScreenPosition();
        return {
          distance: getDistance(new Vector2(x, y), screenPosition),
          roomIcon: roomIcon
        };
      })
      .sort((a, b) => a.distance - b.distance)[0];


    if (nearestNeighbor && nearestNeighbor.distance < HOTSPOT_DISTANCE_THESH) {
      this.activeNeighborId = nearestNeighbor.roomIcon.roomProperty.getId();
    }
    else {
      this.activeNeighborId = '';
    }

    //if there was a change in state, set properties and trigger digest cycle
    if (this.activeNeighborId !== previousActiveNeighborId) {
      this.ngZone.run(() => {
        this.sceneInteractor.getRoomProperties(activeRoomId)
          .forEach(roomIcon => {
            const isPossibleHotspot: boolean = roomIcon.getId() === this.activeNeighborId;
            roomIcon.setPossibleCombinedHotspot(isPossibleHotspot);
          });
      });
    }
  }

  public getActiveNeighborId(): string {
    return this.activeNeighborId;
  }

}

function getDistance(v: Vector2, w: Vector2): number {
  const deltaX = v.getX() - w.getX();
  const deltaY = v.getY() - w.getY();
  return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
}
